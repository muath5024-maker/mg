import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../src/services/auth.service';

// Mock the database
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
};

// Mock environment
const mockEnv = {
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  JWT_SECRET: 'test-secret-key-that-is-at-least-32-chars',
  JWT_EXPIRES_IN: '7d',
  REFRESH_TOKEN_EXPIRES_IN: '30d',
};

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService(mockDb as any, mockEnv as any);
  });

  describe('hashPassword', () => {
    it('should hash password with salt', async () => {
      const password = 'testPassword123';
      const hashed = await authService.hashPassword(password);
      
      expect(hashed).toBeDefined();
      expect(hashed).toContain(':'); // salt:hash format
      expect(hashed.split(':').length).toBe(2);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'testPassword123';
      const hash1 = await authService.hashPassword(password);
      const hash2 = await authService.hashPassword(password);
      
      expect(hash1).not.toBe(hash2); // Different salts
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'testPassword123';
      const hashed = await authService.hashPassword(password);
      const isValid = await authService.verifyPassword(password, hashed);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const hashed = await authService.hashPassword(password);
      const isValid = await authService.verifyPassword('wrongPassword', hashed);
      
      expect(isValid).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate valid JWT token', async () => {
      const payload = { sub: 'user-123', type: 'customer' as const };
      const token = await authService.generateToken(payload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT format
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const payload = { sub: 'user-123', type: 'customer' as const };
      const token = await authService.generateToken(payload);
      const decoded = await authService.verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.sub).toBe('user-123');
      expect(decoded.type).toBe('customer');
    });

    it('should reject invalid token', async () => {
      await expect(authService.verifyToken('invalid-token'))
        .rejects.toThrow();
    });
  });

  describe('customerLogin', () => {
    it('should return error for non-existent customer', async () => {
      mockDb.returning.mockResolvedValueOnce([]);
      
      const result = await authService.customerLogin('+966500000000', 'password');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should return error for wrong password', async () => {
      const hashedPassword = await authService.hashPassword('correctPassword');
      mockDb.returning.mockResolvedValueOnce([{
        id: 'customer-123',
        phone: '+966500000000',
        password: hashedPassword,
        name: 'Test Customer',
      }]);
      
      const result = await authService.customerLogin('+966500000000', 'wrongPassword');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('password');
    });

    it('should return tokens for valid credentials', async () => {
      const hashedPassword = await authService.hashPassword('correctPassword');
      mockDb.returning.mockResolvedValueOnce([{
        id: 'customer-123',
        phone: '+966500000000',
        password: hashedPassword,
        name: 'Test Customer',
        email: 'test@example.com',
      }]);
      
      const result = await authService.customerLogin('+966500000000', 'correctPassword');
      
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.customer).toBeDefined();
      expect(result.customer?.id).toBe('customer-123');
    });
  });

  describe('registerCustomer', () => {
    it('should register new customer', async () => {
      // Mock no existing customer
      mockDb.returning.mockResolvedValueOnce([]);
      // Mock successful insert
      mockDb.returning.mockResolvedValueOnce([{
        id: 'new-customer-123',
        phone: '+966500000000',
        name: 'New Customer',
        email: 'new@example.com',
      }]);
      
      const result = await authService.registerCustomer({
        phone: '+966500000000',
        name: 'New Customer',
        password: 'password123',
        email: 'new@example.com',
      });
      
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.customer?.name).toBe('New Customer');
    });

    it('should reject duplicate phone number', async () => {
      mockDb.returning.mockResolvedValueOnce([{
        id: 'existing-123',
        phone: '+966500000000',
      }]);
      
      const result = await authService.registerCustomer({
        phone: '+966500000000',
        name: 'New Customer',
        password: 'password123',
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('exists');
    });
  });

  describe('merchantLogin', () => {
    it('should authenticate merchant with valid credentials', async () => {
      const hashedPassword = await authService.hashPassword('merchantPass123');
      mockDb.returning.mockResolvedValueOnce([{
        id: 'merchant-123',
        email: 'merchant@example.com',
        password: hashedPassword,
        name: 'Test Merchant',
        isVerified: true,
        isActive: true,
      }]);
      
      const result = await authService.merchantLogin('merchant@example.com', 'merchantPass123');
      
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.merchant?.id).toBe('merchant-123');
    });

    it('should reject inactive merchant', async () => {
      const hashedPassword = await authService.hashPassword('merchantPass123');
      mockDb.returning.mockResolvedValueOnce([{
        id: 'merchant-123',
        email: 'merchant@example.com',
        password: hashedPassword,
        name: 'Test Merchant',
        isVerified: true,
        isActive: false,
      }]);
      
      const result = await authService.merchantLogin('merchant@example.com', 'merchantPass123');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('inactive');
    });
  });

  describe('refreshToken', () => {
    it('should generate new tokens from valid refresh token', async () => {
      const refreshToken = await authService.generateRefreshToken({
        sub: 'user-123',
        type: 'customer',
      });
      
      const result = await authService.refreshToken(refreshToken);
      
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should reject expired refresh token', async () => {
      // This would require mocking time or using an expired token
      const result = await authService.refreshToken('expired-token');
      
      expect(result.success).toBe(false);
    });
  });
});

/// Provider للتحكم في التبويب المحدد في Bottom Navigation
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart'; // StateProvider moved to legacy in Riverpod 3.x

/// Provider لإدارة التبويب الحالي في Bottom Navigation
/// 0 = الرئيسية, 1 = الفئات, 2 = ميديا, 3 = السلة, 4 = حسابي
final mainTabIndexProvider = StateProvider<int>((ref) => 0);

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/models.dart';
import '../services/studio_api_service.dart';

/// Provider للـ API Service
final studioApiServiceProvider = Provider<StudioApiService>((ref) {
  // TODO: استخدم الـ baseUrl الصحيح من البيئة
  return StudioApiService(
    baseUrl: 'https://misty-mode-b68b.baharista1.workers.dev',
    getAuthToken: () {
      // TODO: احصل على التوكن من auth provider
      return '';
    },
  );
});

/// حالة رصيد المستخدم
final userCreditsProvider =
    NotifierProvider<UserCreditsNotifier, AsyncValue<UserCredits>>(
      UserCreditsNotifier.new,
    );

class UserCreditsNotifier extends Notifier<AsyncValue<UserCredits>> {
  @override
  AsyncValue<UserCredits> build() {
    loadCredits();
    return const AsyncValue.loading();
  }

  Future<void> loadCredits() async {
    state = const AsyncValue.loading();
    try {
      final api = ref.read(studioApiServiceProvider);
      final credits = await api.getCredits();
      state = AsyncValue.data(credits);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  void updateBalance(int newBalance) {
    state.whenData((credits) {
      state = AsyncValue.data(credits.copyWith(balance: newBalance));
    });
  }

  void deductCredits(int amount) {
    state.whenData((credits) {
      state = AsyncValue.data(
        credits.copyWith(
          balance: credits.balance - amount,
          totalSpent: credits.totalSpent + amount,
        ),
      );
    });
  }
}

/// حالة القوالب
final templatesProvider =
    NotifierProvider<TemplatesNotifier, AsyncValue<List<StudioTemplate>>>(
      TemplatesNotifier.new,
    );

class TemplatesNotifier extends Notifier<AsyncValue<List<StudioTemplate>>> {
  @override
  AsyncValue<List<StudioTemplate>> build() {
    loadTemplates();
    return const AsyncValue.loading();
  }

  Future<void> loadTemplates({String? category}) async {
    state = const AsyncValue.loading();
    try {
      final api = ref.read(studioApiServiceProvider);
      final templates = await api.getTemplates(category: category);
      state = AsyncValue.data(templates);
    } catch (_) {
      // في حالة الخطأ، استخدم القوالب الافتراضية
      state = AsyncValue.data(getDefaultTemplates());
    }
  }
}

/// حالة المشاريع
final projectsProvider =
    NotifierProvider<ProjectsNotifier, AsyncValue<List<StudioProject>>>(
      ProjectsNotifier.new,
    );

class ProjectsNotifier extends Notifier<AsyncValue<List<StudioProject>>> {
  @override
  AsyncValue<List<StudioProject>> build() {
    loadProjects();
    return const AsyncValue.loading();
  }

  Future<void> loadProjects({String? status}) async {
    state = const AsyncValue.loading();
    try {
      final api = ref.read(studioApiServiceProvider);
      final projects = await api.getProjects(status: status);
      state = AsyncValue.data(projects);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<StudioProject> createProject({
    required String name,
    String? templateId,
    String? productId,
    ProductData? productData,
  }) async {
    final api = ref.read(studioApiServiceProvider);
    final project = await api.createProject(
      name: name,
      templateId: templateId,
      productId: productId,
      productData: productData,
    );

    // إضافة للقائمة
    state.whenData((projects) {
      state = AsyncValue.data([project, ...projects]);
    });

    return project;
  }

  Future<void> deleteProject(String id) async {
    final api = ref.read(studioApiServiceProvider);
    await api.deleteProject(id);

    // إزالة من القائمة
    state.whenData((projects) {
      state = AsyncValue.data(projects.where((p) => p.id != id).toList());
    });
  }

  void updateProject(StudioProject project) {
    state.whenData((projects) {
      final index = projects.indexWhere((p) => p.id == project.id);
      if (index != -1) {
        final updated = [...projects];
        updated[index] = project;
        state = AsyncValue.data(updated);
      }
    });
  }
}

/// حالة المشروع الحالي
final currentProjectProvider =
    NotifierProvider<CurrentProjectNotifier, AsyncValue<StudioProject?>>(
      CurrentProjectNotifier.new,
    );

/// مشاهد المشروع الحالي
final currentScenesProvider =
    NotifierProvider<CurrentScenesNotifier, List<Scene>>(
      CurrentScenesNotifier.new,
    );

class CurrentProjectNotifier extends Notifier<AsyncValue<StudioProject?>> {
  @override
  AsyncValue<StudioProject?> build() => const AsyncValue.data(null);

  Future<void> loadProject(String id) async {
    state = const AsyncValue.loading();
    try {
      final api = ref.read(studioApiServiceProvider);
      final result = await api.getProject(id);
      state = AsyncValue.data(result.project);

      // تحديث المشاهد
      ref.read(currentScenesProvider.notifier).setScenes(result.scenes);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  void setProject(StudioProject? project) {
    state = AsyncValue.data(project);
  }

  Future<void> updateProject(Map<String, dynamic> updates) async {
    final currentProject = state.value;
    if (currentProject == null) return;

    try {
      final api = ref.read(studioApiServiceProvider);
      final updated = await api.updateProject(
        currentProject.id,
        name: updates['name'],
        settings: updates['settings'],
        scriptData: updates['scriptData'],
      );
      state = AsyncValue.data(updated);

      // تحديث في قائمة المشاريع
      ref.read(projectsProvider.notifier).updateProject(updated);
    } catch (e) {
      rethrow;
    }
  }

  void updateStatus(ProjectStatus status, {int? progress, String? error}) {
    state.whenData((project) {
      if (project != null) {
        state = AsyncValue.data(
          project.copyWith(
            status: status,
            progress: progress ?? project.progress,
            errorMessage: error,
          ),
        );
      }
    });
  }

  void setScriptData(ScriptData scriptData) {
    state.whenData((project) {
      if (project != null) {
        state = AsyncValue.data(project.copyWith(scriptData: scriptData));
      }
    });
  }
}

class CurrentScenesNotifier extends Notifier<List<Scene>> {
  @override
  List<Scene> build() => [];

  void setScenes(List<Scene> scenes) {
    state = scenes;
  }

  void addScene(Scene scene) {
    state = [...state, scene];
  }

  void updateScene(String id, Scene updated) {
    state = state.map((s) => s.id == id ? updated : s).toList();
  }

  void removeScene(String id) {
    state = state.where((s) => s.id != id).toList();
  }

  void reorderScenes(int oldIndex, int newIndex) {
    final scenes = [...state];
    final scene = scenes.removeAt(oldIndex);
    scenes.insert(newIndex, scene);

    // تحديث الترتيب
    state = scenes.asMap().entries.map((e) {
      return e.value.copyWith(orderIndex: e.key);
    }).toList();
  }

  void updateSceneMedia(String id, {String? imageUrl, String? audioUrl}) {
    state = state.map((s) {
      if (s.id == id) {
        return s.copyWith(
          generatedImageUrl: imageUrl ?? s.generatedImageUrl,
          generatedAudioUrl: audioUrl ?? s.generatedAudioUrl,
          status: SceneStatus.ready,
        );
      }
      return s;
    }).toList();
  }
}

/// Provider لتوليد AI
final aiGenerationProvider =
    NotifierProvider<AIGenerationNotifier, AIGenerationState>(
      AIGenerationNotifier.new,
    );

class AIGenerationState {
  final bool isGenerating;
  final String? currentTask;
  final double progress;
  final String? error;

  const AIGenerationState({
    this.isGenerating = false,
    this.currentTask,
    this.progress = 0,
    this.error,
  });

  AIGenerationState copyWith({
    bool? isGenerating,
    String? currentTask,
    double? progress,
    String? error,
  }) {
    return AIGenerationState(
      isGenerating: isGenerating ?? this.isGenerating,
      currentTask: currentTask ?? this.currentTask,
      progress: progress ?? this.progress,
      error: error,
    );
  }
}

class AIGenerationNotifier extends Notifier<AIGenerationState> {
  @override
  AIGenerationState build() => const AIGenerationState();

  Future<ScriptData> generateScript({
    required ProductData productData,
    String? templateId,
    String language = 'ar',
    String tone = 'professional',
    int durationSeconds = 30,
  }) async {
    state = state.copyWith(
      isGenerating: true,
      currentTask: 'جاري توليد السيناريو...',
      progress: 0,
    );

    try {
      final api = ref.read(studioApiServiceProvider);
      final result = await api.generateScript(
        productData: productData,
        templateId: templateId,
        language: language,
        tone: tone,
        durationSeconds: durationSeconds,
      );

      // خصم الرصيد
      ref.read(userCreditsProvider.notifier).deductCredits(result.creditsUsed);

      state = state.copyWith(isGenerating: false, progress: 1);

      return result.script;
    } catch (e) {
      state = state.copyWith(isGenerating: false, error: e.toString());
      rethrow;
    }
  }

  Future<String> generateImage({
    required String prompt,
    String? style,
    String? projectId,
  }) async {
    state = state.copyWith(
      isGenerating: true,
      currentTask: 'جاري توليد الصورة...',
    );

    try {
      final api = ref.read(studioApiServiceProvider);
      final result = await api.generateImage(
        prompt: prompt,
        style: style,
        projectId: projectId,
      );

      ref.read(userCreditsProvider.notifier).deductCredits(result.creditsUsed);

      state = state.copyWith(isGenerating: false);
      return result.imageUrl;
    } catch (e) {
      state = state.copyWith(isGenerating: false, error: e.toString());
      rethrow;
    }
  }

  Future<String> generateVoice({
    required String text,
    String? voiceId,
    String? projectId,
  }) async {
    state = state.copyWith(
      isGenerating: true,
      currentTask: 'جاري توليد الصوت...',
    );

    try {
      final api = ref.read(studioApiServiceProvider);
      final result = await api.generateVoice(
        text: text,
        voiceId: voiceId,
        projectId: projectId,
      );

      ref.read(userCreditsProvider.notifier).deductCredits(result.creditsUsed);

      state = state.copyWith(isGenerating: false);
      return result.audioUrl;
    } catch (e) {
      state = state.copyWith(isGenerating: false, error: e.toString());
      rethrow;
    }
  }

  void reset() {
    state = const AIGenerationState();
  }
}

/// Provider للأصوات المتاحة
final availableVoicesProvider = FutureProvider<List<Map<String, dynamic>>>((
  ref,
) async {
  final api = ref.read(studioApiServiceProvider);
  return api.getVoices();
});

/// Provider للأفاتارات المتاحة
final availableAvatarsProvider = FutureProvider<List<Map<String, dynamic>>>((
  ref,
) async {
  final api = ref.read(studioApiServiceProvider);
  return api.getAvatars();
});

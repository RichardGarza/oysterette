// Setup globals for React Native
global.__DEV__ = true;
global.IS_REACT_ACT_ENVIRONMENT = true;

// Set up native bridge config to prevent Invariant Violation
global.__fbBatchedBridgeConfig = {
  remoteModuleConfig: [],
  localModulesConfig: [],
};

// Mock AsyncStorage
import '@react-native-async-storage/async-storage/jest/async-storage-mock';

// Mock React Native completely
jest.mock('react-native', () => {
  const React = require('react');

  const mockComponent = (name) => {
    const Component = React.forwardRef((props, ref) => {
      return React.createElement(name, { ...props, ref }, props.children);
    });
    Component.displayName = name;
    return Component;
  };

  return {
    Platform: {
      OS: 'ios',
      Version: 14,
      select: jest.fn((obj) => obj.ios || obj.default),
      isTesting: true,
    },
    StyleSheet: {
      create: (styles) => styles,
      hairlineWidth: 1,
      absoluteFill: {},
      flatten: (style) => style,
    },
    View: mockComponent('View'),
    Text: React.forwardRef((props, ref) => {
      const { children, onPress, testID, ...otherProps } = props;
      // If Text has onPress, make it pressable
      if (onPress) {
        return React.createElement(
          'Pressable',
          {
            ...otherProps,
            onPress,
            testID: testID || 'Text',
            ref,
          },
          React.createElement('Text', { ...otherProps }, children)
        );
      }
      return React.createElement('Text', { ...props, ref }, children);
    }),
    TouchableOpacity: mockComponent('TouchableOpacity'),
    Pressable: React.forwardRef((props, ref) => {
      const { children, onPress, disabled, testID, ...otherProps } = props;
      return React.createElement(
        'Pressable',
        {
          ...otherProps,
          onPress: !disabled ? onPress : undefined,
          disabled,
          testID: testID || 'Pressable',
          ref,
        },
        children
      );
    }),
    ScrollView: mockComponent('ScrollView'),
    FlatList: React.forwardRef((props, ref) => {
      const { data, renderItem, keyExtractor, testID, ListEmptyComponent, refreshing, onRefresh, contentContainerStyle, ...otherProps } = props;

      // If no data or data is empty, render ListEmptyComponent
      if (!data || data.length === 0) {
        const emptyComponent = typeof ListEmptyComponent === 'function'
          ? React.createElement(ListEmptyComponent)
          : ListEmptyComponent;

        return React.createElement(
          'FlatList',
          { ...otherProps, testID: testID || 'FlatList', ref },
          emptyComponent
        );
      }

      // Render each item in the data array
      return React.createElement(
        'FlatList',
        { ...otherProps, testID: testID || 'FlatList', ref },
        data.map((item, index) => {
          const key = keyExtractor ? keyExtractor(item, index) : String(index);
          return renderItem({ item, index, separators: {} });
        })
      );
    }),
    SectionList: mockComponent('SectionList'),
    Image: mockComponent('Image'),
    TextInput: mockComponent('TextInput'),
    KeyboardAvoidingView: mockComponent('KeyboardAvoidingView'),
    SafeAreaView: mockComponent('SafeAreaView'),
    ActivityIndicator: mockComponent('ActivityIndicator'),
    TouchableHighlight: mockComponent('TouchableHighlight'),
    TouchableWithoutFeedback: mockComponent('TouchableWithoutFeedback'),
    RefreshControl: mockComponent('RefreshControl'),
    StatusBar: mockComponent('StatusBar'),
    Modal: mockComponent('Modal'),
    Button: mockComponent('Button'),
    Switch: mockComponent('Switch'),
    Alert: {
      alert: jest.fn(),
      prompt: jest.fn(),
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 667 })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      set: jest.fn(),
    },
    Animated: {
      View: mockComponent('Animated.View'),
      Text: mockComponent('Animated.Text'),
      Image: mockComponent('Animated.Image'),
      ScrollView: mockComponent('Animated.ScrollView'),
      FlatList: mockComponent('Animated.FlatList'),
      timing: jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })),
      spring: jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })),
      decay: jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })),
      sequence: jest.fn((animations) => ({ start: jest.fn(), stop: jest.fn() })),
      parallel: jest.fn((animations) => ({ start: jest.fn(), stop: jest.fn() })),
      loop: jest.fn((animation) => ({ start: jest.fn(), stop: jest.fn() })),
      delay: jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })),
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        setOffset: jest.fn(),
        flattenOffset: jest.fn(),
        extractOffset: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        removeAllListeners: jest.fn(),
        stopAnimation: jest.fn(),
        resetAnimation: jest.fn(),
        interpolate: jest.fn(() => ({ setValue: jest.fn() })),
      })),
      ValueXY: jest.fn(() => ({
        setValue: jest.fn(),
        setOffset: jest.fn(),
        flattenOffset: jest.fn(),
        extractOffset: jest.fn(),
        resetAnimation: jest.fn(),
        stopAnimation: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        x: { setValue: jest.fn() },
        y: { setValue: jest.fn() },
        getLayout: jest.fn(),
        getTranslateTransform: jest.fn(),
      })),
      event: jest.fn(),
      createAnimatedComponent: jest.fn((component) => component),
      multiply: jest.fn(),
      divide: jest.fn(),
      add: jest.fn(),
      subtract: jest.fn(),
      modulo: jest.fn(),
      diffClamp: jest.fn(),
    },
    PixelRatio: {
      get: jest.fn(() => 2),
      getFontScale: jest.fn(() => 1),
      getPixelSizeForLayoutSize: jest.fn((size) => size * 2),
      roundToNearestPixel: jest.fn((size) => Math.round(size)),
    },
    Linking: {
      openURL: jest.fn(() => Promise.resolve()),
      canOpenURL: jest.fn(() => Promise.resolve(true)),
      getInitialURL: jest.fn(() => Promise.resolve(null)),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      sendIntent: jest.fn(),
    },
    AppState: {
      currentState: 'active',
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
      removeEventListener: jest.fn(),
    },
    Keyboard: {
      addListener: jest.fn(() => ({ remove: jest.fn() })),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
      dismiss: jest.fn(),
      scheduleLayoutAnimation: jest.fn(),
    },
    NativeModules: {},
    NativeEventEmitter: jest.fn(() => ({
      addListener: jest.fn(),
      removeListeners: jest.fn(),
    })),
  };
});

// Mock expo modules
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

jest.mock('expo-camera', () => ({
  Camera: 'Camera',
  CameraType: {},
  CameraView: 'CameraView',
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {},
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    isSignedIn: jest.fn(),
  },
}));

jest.mock('@react-native-ml-kit/text-recognition', () => ({
  recognize: jest.fn(),
}));

// Mock API service
jest.mock('./src/services/api', () => ({
  setAuthToken: jest.fn(),
  getAuthToken: jest.fn(),
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
  },
  oysterApi: {
    getAll: jest.fn(),
    search: jest.fn(),
    getById: jest.fn(),
  },
  reviewApi: {
    submitReview: jest.fn(),
  },
  favoritesApi: {
    getUserFavorites: jest.fn(),
    addFavorite: jest.fn(),
    removeFavorite: jest.fn(),
    syncFavorites: jest.fn(),
  },
}));

// Mock auth storage service
jest.mock('./src/services/auth', () => ({
  authStorage: {
    saveToken: jest.fn().mockResolvedValue(undefined),
    getToken: jest.fn().mockResolvedValue(null),
    clearToken: jest.fn().mockResolvedValue(undefined),
    saveUser: jest.fn().mockResolvedValue(undefined),
    getUser: jest.fn().mockResolvedValue(null),
    clearUser: jest.fn().mockResolvedValue(undefined),
    saveAuth: jest.fn().mockResolvedValue(undefined),
    clearAuth: jest.fn().mockResolvedValue(undefined),
    saveBadgeLevel: jest.fn().mockResolvedValue(undefined),
    getBadgeLevel: jest.fn().mockResolvedValue(null),
  },
}));

// Mock favorites storage service
jest.mock('./src/services/favorites', () => ({
  favoritesStorage: {
    getFavorites: jest.fn().mockResolvedValue([]),
    addFavorite: jest.fn().mockResolvedValue(undefined),
    removeFavorite: jest.fn().mockResolvedValue(undefined),
    toggleFavorite: jest.fn().mockResolvedValue(true),
    syncWithBackend: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock temp reviews storage service
jest.mock('./src/services/tempReviews', () => ({
  tempReviewsStorage: {
    save: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    remove: jest.fn().mockResolvedValue(undefined),
    getAll: jest.fn().mockResolvedValue({}),
  },
}));

// Mock React Query
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: jest.fn(() => ({
      data: undefined,
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: false,
      refetch: jest.fn(),
    })),
    useMutation: jest.fn(() => ({
      mutate: jest.fn(),
      mutateAsync: jest.fn(),
      isLoading: false,
      isError: false,
      isSuccess: false,
    })),
    useQueryClient: jest.fn(() => ({
      invalidateQueries: jest.fn(),
      setQueryData: jest.fn(),
      getQueryData: jest.fn(),
    })),
  };
});

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    NavigationContainer: ({ children }) => children,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      push: jest.fn(),
      pop: jest.fn(),
      setOptions: jest.fn(),
      addListener: jest.fn(() => jest.fn()),
    }),
    useRoute: () => ({
      params: {},
      key: 'test',
      name: 'Test',
    }),
    useFocusEffect: jest.fn((callback) => {
      // Call callback once to simulate focus
      if (typeof callback === 'function') {
        callback();
      }
    }),
    useIsFocused: () => true,
  };
});

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: () => null,
  }),
}));

// Mock React Native Safe Area Context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  initialWindowMetrics: {
    frame: { x: 0, y: 0, width: 0, height: 0 },
    insets: { top: 0, left: 0, right: 0, bottom: 0 },
  },
}));

// Suppress console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

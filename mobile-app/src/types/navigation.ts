export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  OysterList: { searchQuery?: string; showFavorites?: boolean };
  OysterDetail: { oysterId: string };
  AddOyster: undefined;
  AddReview: { oysterId: string; existingReview?: any }; // Review type
  EditReview: { reviewId: string };
  Settings: undefined;
  TopOysters: undefined;
  Profile: undefined;
  PrivacySettings: undefined;
  SetFlavorProfile: undefined;
  ScanMenu: undefined;
  Friends: undefined;
  PairedMatches: { friendId: string };
  XPStats: undefined;
  Menu: undefined;
};

export type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;
// Add other props as needed, e.g., OysterListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OysterList'>;

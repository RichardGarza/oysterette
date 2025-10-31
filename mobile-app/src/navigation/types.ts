import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  OysterList: undefined;
  OysterDetail: { oysterId: string };
  AddOyster: undefined;
  AddReview: { oysterId: string; oysterName: string };
  Settings: undefined;
};

export type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

export type OysterListScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'OysterList'
>;

export type OysterDetailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'OysterDetail'
>;

export type OysterDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  'OysterDetail'
>;

export type AddReviewScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AddReview'
>;

export type AddReviewScreenRouteProp = RouteProp<
  RootStackParamList,
  'AddReview'
>;

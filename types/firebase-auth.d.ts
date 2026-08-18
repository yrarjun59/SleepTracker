declare module "firebase/auth/react-native" {
  export * from "firebase/auth";
  import type { ReactNativeAsyncStorage } from "@react-native-async-storage/async-storage";

  export function getReactNativePersistence(
    storage: ReactNativeAsyncStorage
  ): any;
}
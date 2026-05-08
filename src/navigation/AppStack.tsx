import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AddMedicationScreen from '@/modules/medications/screens/AddMedicationScreen';
import HomeScreen from '@/modules/medications/screens/HomeScreen';
import { colors } from '@/shared/constants/theme';
import { AppStackParamList } from '@/navigation/types';

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.bg },
      headerTintColor: colors.text,
      headerShadowVisible: false,
    }}
  >
    <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
    <Stack.Screen
      name="AddMedication"
      component={AddMedicationScreen}
      options={{ title: 'Nueva medicación' }}
    />
  </Stack.Navigator>
);

export default AppStack;

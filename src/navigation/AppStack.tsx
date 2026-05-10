import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AddMedicationScreen from '@/modules/medications/screens/AddMedicationScreen';
import HomeScreen from '@/modules/medications/screens/HomeScreen';
import { AppStackParamList } from '@/navigation/types';

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="AddMedication" component={AddMedicationScreen} />
  </Stack.Navigator>
);

export default AppStack;

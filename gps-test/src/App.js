import * as React from 'react';
import MapView, { Callout, Circle, Marker } from 'react-native-maps';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

const LOCATION_TRACKING = 'location-tracking';  /*상수로 선언해서 오타를 방지했군,,,이 아니라 task 이름이었군,,, */
const GEOFENCING = 'geofencing';



Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const App = () => {
  const [pin, setPin] = React.useState({
    latitude: 37.33890,
    longitude: 126.73438,
  });

  

  const [locationStarted, setLocationStarted] = React.useState(false);
  const [geofencingStarted, setGeofencingStarted] = React.useState(false);
  const [isEntered, setIsEntered] = React.useState(false);

  const [expoPushToken, setExpoPushToken] = React.useState('');
  const [notification, setNotification] = React.useState(false);
  const notificationListener = React.useRef();
  const responseListener = React.useRef();

  const region = Location.LocationRegion = {
    identifier: "company",
    latitude: pin['latitude'],
    longitude: pin['longitude'],
    radius: 50,
  };

  // 렌더링 될 때 호출되는 함수
  React.useEffect(() => {

    // 권한 취득을 위한 config 함수 생성(비동기)
    const config = async () => {
            let resf = await Location.requestForegroundPermissionsAsync();
            let resb = await Location.requestBackgroundPermissionsAsync();
            if (resf.status != 'granted' && resb.status !== 'granted') {
                console.log('Permission to access location was denied');
            } else {
                console.log('Permission to access location granted');
            }
        };
    config();

    /*// 즉시 실행 함수
    (async () => {

      let location = await Location.getCurrentPositionAsync({});
      console.log(location);

      setPin({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();*/

    const startLocationTracking = async () => { /**왜 비동기 함수? -> 위치 받아오는 함수는 비동기, 받아올 때까지 기다리지 않고 다른 코드 계속 실행 */
        // (task이름, 옵션)을 넣음, 옵션 부분은 android와 iOS가 다르므로 확인 필요
        await Location.startLocationUpdatesAsync(LOCATION_TRACKING, {
            accuracy: Location.Accuracy.Highest,    // 정확도, 정의된 상수 사용하자.
            timeInterval: 1000,    // 실행 간격, android-only
            distanceInterval: 0,    // 위치가 변했을 때만 실행되도록? -> 최소 몇 미터 이상 움직이면 위치 갱신되도록
        });

        const hasStarted = await Location.hasStartedLocationUpdatesAsync(
            LOCATION_TRACKING
        );

        setLocationStarted(hasStarted);
        console.log('tracking started?', hasStarted);

    };
    startLocationTracking();

    

    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  React.useEffect(() => {
    const startGeoFencing = async () => {
          
      await Location.startGeofencingAsync(GEOFENCING, [region]);
          
      const hasGeofencingStarted = await Location.hasStartedGeofencingAsync(
        GEOFENCING
      );

      setGeofencingStarted(hasGeofencingStarted);
      console.log('geofencing created?', hasGeofencingStarted);
    };
    startGeoFencing();
  }, [pin]);

  return (
    <View style={styles.container}>
        <MapView 
            style={styles.map}
            initialRegion={{
                latitude: pin['latitude'],
                longitude: pin['longitude'],
                latitudeDelta: 0.003,
                longitudeDelta: 0.003,
            }}
            showsUserLocation={true}       
        >
            <Marker
                title="Test Title"
                description="Test Description"
                coordinate={ pin }
                pinColor="gold"
                draggable={true}
                onDragEnd={(e) => {
                    console.log("Drag End", e.nativeEvent.coordinate);

                    setPin({
                      latitude: e.nativeEvent.coordinate.latitude,
                      longitude: e.nativeEvent.coordinate.longitude,
                    });
                }}
            >
                <Callout>
                    <Text>This is a Callout</Text>
                </Callout>
            </Marker>
            <Circle
                center={{
                  latitude: pin['latitude'],
                  longitude: pin['longitude'],
                }}
                radius={50}
            >           
            </Circle>
        </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});

async function schedulePushNotificationEnter() {
  await Notifications.scheduleNotificationAsync({
      content: {
        title: "출근하시나요? 🏢",
        body: '사용자의 위치가 [회사]로 감지되었습니다.',
        data: { data: 'goes here' },
      },
      trigger: { seconds: 2 },
    });
}
async function schedulePushNotificationExit() {
  await Notifications.scheduleNotificationAsync({
      content: {
        title: "퇴근하시나요? 🚗",
        body: '사용자의 위치가 [회사]에서 벗어났습니다.',
        data: { data: 'goes here' },
      },
      trigger: { seconds: 2 },
    });
}

async function registerForPushNotificationsAsync() {
  let token;
  if (Constants.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log(token);
  } else {
    alert('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}

// task 정의 { data: { locations }, error } 이런 식으로 쓰기도 하나 봄
TaskManager.defineTask(LOCATION_TRACKING, async ({ data, error }) => {

    if (error) {
        console.log('LOCATION_TRACKING task ERROR:', error);
        return;
    }

    if (data) {
        const { locations } = data; // data 객체를 destructuring하여 locations에 할당 -> 배열처럼 쓰려고?
        let lat = locations[0].coords.latitude; // 위도
        let long = locations[0].coords.longitude;   // 경도
        console.log(
            `${new Date(Date.now()).toLocaleString()}: ${lat},${long}`
        );
    }
});

 TaskManager.defineTask(GEOFENCING, ({ data: { eventType, region }, error }) => {
  if (error) {
    // check `error.message` for more details.
    return;
  }
  
  if (eventType === Location.GeofencingEventType.Enter) {
    console.log("You've entered region:", region);
    schedulePushNotificationEnter();
  } else if (eventType === Location.GeofencingEventType.Exit) {
    console.log("You've left region:", region);
    schedulePushNotificationExit();
  }
});


export default App;
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';


const LOCATION_TRACKING = 'location-tracking';  /*상수로 선언해서 오타를 방지했군,,,이 아니라 task 이름이었군,,, */

function UserLocation() {
    /**위치 추적 시작여부 - true, false */
    const [locationStarted, setLocationStarted] = React.useState(false);

    /**함수 정의 - 위치 추적 시작 */
    const startLocationTracking = async () => { /**왜 비동기 함수? -> 위치 받아오는 함수는 비동기, 받아올 때까지 기다리지 않고 다른 코드 계속 실행 */
        // (task이름, 옵션)을 넣음, 옵션 부분은 android와 iOS가 다르므로 확인 필요
        await Location.startLocationUpdatesAsync(LOCATION_TRACKING, {
            accuracy: Location.Accuracy.Highest,    // 정확도, 정의된 상수 사용하자.
            timeInterval: 10000,    // 실행 간격, android-only
            distanceInterval: 0,    // 위치가 변했을 때만 실행되도록? -> 최소 몇 미터 이상 움직이면 위치 갱신되도록
        });

        const hasStarted = await Location.hasStartedLocationUpdatesAsync(
            LOCATION_TRACKING
        );

        setLocationStarted(hasStarted);
        console.log('tracking started?', hasStarted);
    };
    /**위의 함수가 비동기 함수이므로 얘는 언제나 실행 가능 */
    React.useEffect(() => {
        /**permission 받을 때까지 기다리지 X, 다른 코드들은 계속 실행 */
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
    }, []);
    
    // Start Tracking 버튼 누르면 실행
    const startLocation = () => {0
        startLocationTracking();
    }

    // Stop Tracking 버튼 누르면 실행
    const stopLocation = () => {
        setLocationStarted(false);
        TaskManager.isTaskRegisteredAsync(LOCATION_TRACKING)
            .then((tracking) => {
                if (tracking) {
                    Location.stopLocationUpdatesAsync(LOCATION_TRACKING);
                }
            })
    }

    return (
        <View>
            {locationStarted ?
                <TouchableOpacity onPress={stopLocation}>
                    <Text style={styles.btnText}>Stop Tracking</Text>
                </TouchableOpacity>
                    :
                <TouchableOpacity onPress={startLocation}>
                    <Text style={styles.btnText}>Start Tracking</Text>
                </TouchableOpacity>
            }
        </View>
     );
}

const styles = StyleSheet.create({
    btnText: {
        fontSize: 20,
        backgroundColor: 'green',
        color: 'white',
        paddingHorizontal: 30,
        paddingVertical: 10,
        borderRadius: 5,
        marginTop: 10,
    },
});

// task 정의 { data: { locations }, error } 이런 식으로 쓰기도 하나 봄
TaskManager.defineTask(LOCATION_TRACKING, async ({ data, error }) => {

    if (error) {
        console.log('LOCATION_TRACKING task ERROR:', error);
        return;
    }

    if (data) {0
        const { locations } = data; // data 객체를 destructuring하여 locations에 할당 -> 배열처럼 쓰려고?
        let lat = locations[0].coords.latitude; // 위도
        let long = locations[0].coords.longitude;   // 경도
        console.log(
            `${new Date(Date.now()).toLocaleString()}: ${lat},${long}`
        );
    }
});

export default UserLocation;
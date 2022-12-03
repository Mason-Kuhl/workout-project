import * as SQLite from "expo-sqlite";
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, ScrollView, View, TouchableOpacity, Alert, TextInput, RefreshControl, Image, Platform } from 'react-native';
import {Linking} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import React, { useState, useEffect } from 'react';
import { NavigationContainer, StackActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { differenceInMinutes, format, formatDuration, parseISO } from 'date-fns';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();
setTimeout(SplashScreen.hideAsync, 2000);

function openDatabase() {
  if (Platform.OS === "web") {
    return {
      transaction: () => {
        return {
          executeSql: () => {},
        };
      },
    };
  }

  const db = SQLite.openDatabase("workoutDB.db");
  return db;
}

const db = openDatabase();

function HomeScreen({ navigation }) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const homeImage = require('./assets/workoutProjectStart.jpg');

  onStart = () => {
    var dateNow = format(new Date(), 'yyyy-MM-dd');
    var time = format(new Date(), 'HH:mm:ss');
    var workoutDate = new Date().toISOString();

    var tzoffset = (new Date()).getTimezoneOffset() * 60000;
    var isoStart = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);

    setDate(dateNow);
    setStartTime(time);

    navigation.navigate('Moves', {
      date: dateNow,
      startTime: time,
      isoStart: isoStart,
    });
  }

  return (
    <View style={styles.HomeContainer}>
      <Text style={styles.HomeHeader}>Start Tracking Your Workout</Text>
      <View style={styles.StartButtonContainer}>
        <TouchableOpacity 
          style={styles.StartWorkoutBtn}
          //onPress={this.onStart}
          onPress={onStart}
          >
          <Text style={styles.StartBtnTxt}>Start Workout</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.HomeImgContainer}>
          <Image source={homeImage} style={styles.homeImage} />
        </View>
    </View>
  );
}

function MovesScreen({route, navigation}){
  const [name, setName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [id, setId] = useState(null);
  const { date, startTime, isoStart } = route.params;

  // Workout Links
  const AltDbCurl = 'https://www.bodybuilding.com/exercises/dumbbell-alternate-bicep-curl';
  const HammerCurl= 'https://www.bodybuilding.com/exercises/hammer-curls';
  const StandingTricepExt = 'https://www.bodybuilding.com/exercises/standing-dumbbell-triceps-extension';
  

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        "drop table workouts;"
      );
      tx.executeSql(
        "drop table moves;"
      );
      tx.executeSql(
        "create table if not exists workouts (id integer primary key not null, date text, startTime text, endTime text null, totalMinutes integer null);"
      );
      tx.executeSql("select * from workouts", [], (_, { rows }) =>
          console.log(rows)
        );
      tx.executeSql(
        "create table if not exists moves (id integer primary key not null, workoutId integer, name text, sets integer, reps integer, difficulty integer);"
      );
      tx.executeSql("select * from moves", [], (_, { rows }) =>
          console.log(rows)
        );
    });

    onSaveWorkout();
  }, []);

  onSaveWorkout = () => {  
    db.transaction(
      (tx) => {
        tx.executeSql("insert into workouts (date, startTime, endTime, totalMinutes) values (?, ?, ?, ?)", [date, startTime, null, null]);
        tx.executeSql("select * from workouts", [], (_, { rows }) =>
          console.log(rows)
        );
      },
      null,
    );

    onGetId();
  }

  onGetId = () => {  
    db.transaction((tx) => {
      tx.executeSql("select id from workouts where date=? and startTime=?;",
      [date, startTime],
      (_, { rows: { _array } }) => setId(_array)
      );
      tx.executeSql("select id from workouts where date=? and startTime=?;", [date, startTime], (_, { rows }) =>
          console.log(rows)
      );
    });
  }

  onSaveMove = (moveName) => {
    db.transaction(
      (tx) => {
        tx.executeSql("insert into moves (workoutId, name, sets, reps, difficulty) values (?, ?, ?, ?, ?);", [id[0].id, moveName, sets, reps, difficulty]);
        tx.executeSql("select * from moves", [], (_, { rows }) =>
          console.log(rows)
        );
      },
      null,
    );
    setName(moveName);
  }

  onEnd = () => {
    var endTime = format(new Date(), 'HH:mm:ss');
    var tzoffset = (new Date()).getTimezoneOffset() * 60000;
    var isoEnd = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);
    var minDiff = differenceInMinutes(parseISO(isoEnd), parseISO(isoStart));

    onUpdateWorkout(endTime, minDiff);
  }

  onUpdateWorkout = (endTime, minDiff) => {
    db.transaction(
      (tx) => {
        tx.executeSql(`update workouts set endTime=?, totalMinutes=? where id=?`, [endTime, minDiff, id[0].id]);
        tx.executeSql("select * from workouts", [], (_, { rows }) =>
          console.log(rows)
        );
      },
      null,
    );
    navigation.navigate('Workouts');
  }

  onOpenLink = (url) => {
    WebBrowser.openBrowserAsync(url);
  }

  return(
    <View style={styles.MovesContainer}>
      <View style={styles.EndBtnContainer}>
        <TouchableOpacity
          style={styles.endButton}
          onPress={() => onEnd()}      
          >
          <Text style={styles.EndButtonTxt}>End Workout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={styles.MovesSvContnet}>
          <Text style={styles.workoutMoveTitle}>Alternating Dumbbell Curl</Text>
          <TouchableOpacity 
            style={styles.linkBtn}
            onPress={() => onOpenLink(AltDbCurl)}
          >
            <Text style={styles.workoutMoveLink}>www.bodybuilding.com</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Enter Number of Sets"
            onChangeText={(newSet) => setSets(newSet)}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter Number of Reps"
            onChangeText={(newRep) => setReps(newRep)}
          />
          <TextInput
            style={styles.input}
            placeholder="Level of Difficulty (1-10)"
            onChangeText={(newDiff) => setDifficulty(newDiff)}
          />
          <TouchableOpacity
            style={styles.AddButton}
            onPress={() => onSaveMove("Alternating Dumbbell Curl")}
          >
            <Text style={styles.AddButtonTxt}>Add to Workout</Text>
          </TouchableOpacity>

          <Text style={styles.workoutMoveTitle}>Hammer Dumbbell Curl</Text>
          <TouchableOpacity 
            style={styles.linkBtn}
            onPress={() => onOpenLink(HammerCurl)}
          >
            <Text style={styles.workoutMoveLink}>www.bodybuilding.com</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Enter Number of Sets"
            onChangeText={(newSet) => setSets(newSet)}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter Number of Reps"
            onChangeText={(newRep) => setReps(newRep)}
          />
          <TextInput
            style={styles.input}
            placeholder="Level of Difficulty (1-10)"
            onChangeText={(newDiff) => setDifficulty(newDiff)}
          />
          <TouchableOpacity
            style={styles.AddButton}
            onPress={() => onSaveMove("Hammer Dumbbell Curl")}
          >
            <Text style={styles.AddButtonTxt}>Add to Workout</Text>
          </TouchableOpacity>

          <Text style={styles.workoutMoveTitle}>Standing Tricep Extension</Text>
          <TouchableOpacity 
            style={styles.linkBtn}
            onPress={() => onOpenLink(StandingTricepExt)}
          >
            <Text style={styles.workoutMoveLink}>www.bodybuilding.com</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Enter Number of Sets"
            onChangeText={(newSet) => setSets(newSet)}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter Number of Reps"
            onChangeText={(newRep) => setReps(newRep)}
          />
          <TextInput
            style={styles.input}
            placeholder="Level of Difficulty (1-10)"
            onChangeText={(newDiff) => setDifficulty(newDiff)}
          />
          <TouchableOpacity
            style={styles.AddButton}
            onPress={() => onSaveMove("Tricep Extension")}
          >
            <Text style={styles.AddButtonTxt}>Add to Workout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function WorkoutsScreen({route, navigation}){
  const [items, setItems] = useState(null);
  
  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        `select id, date, totalMinutes from workouts order by date desc;`,
        [], (_, { rows: { _array } }) => setItems(_array),
        console.log(items)
      );
      tx.executeSql("select date, totalMinutes from workouts order by date desc;", [], (_, { rows }) =>
          console.log(rows)
      );
    });
  }, []);

  if (items === null || items.length === 0) {
    return null;      
  }

  onPressItem = (id) => {
    navigation.navigate('WorkoutDetails', {
      id: id,
    });
  }

  return(
    <View style={styles.workoutsContainer}>
      {items.map(({ id, date, totalMinutes }) => (
        <TouchableOpacity 
          key={id}
          style={styles.selectWorkoutBtn}
          onPress = {() => onPressItem(id)}
        >
          <Text style={styles.selectWorkoutBtnTxt}>Date: {date} Total Minutes: {totalMinutes}</Text>
        </TouchableOpacity>

      ))}
    </View>
  );
}

function WorkoutDetailsScreen({route, navigation}){
  const { id } = route.params;
  const [item, setItem] = useState(null);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        `select id, name, sets, reps, difficulty from moves where workoutId=?;`,
        [id], (_, { rows: { _array } }) => setItem(_array),
        console.log(item)
      );
    });
  }, []);

  if (item === null || item.length === 0) {
    return null;  
  }

  return(
    <View style={styles.workoutDetailsContainer}>
      {item.map(({ id, name, sets, reps, difficulty }) => (
        <View style={styles.DetailsContainer}>
          <Text key={id} style={styles.DetailsName}>{name}</Text>
          <Text key={id} style={styles.DetailsSets}>{sets}</Text>
          <Text key={id} style={styles.DetailsReps}>{reps}</Text>
          <Text key={id} style={styles.DetailsDifficulty}>{difficulty}</Text>
        </View>
      ))}
    </View>
  );
}

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Moves" component={MovesScreen} />
        <Stack.Screen name="Workouts" component={WorkoutsScreen} />
        <Stack.Screen name="WorkoutDetails" component={WorkoutDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  HomeHeader: {
    fontSize: 28,
    textAlign: 'center',
    fontWeight: 'bold',
    paddingTop: 10,
  },
  StartButtonContainer: {
    paddingTop: 10,
  },
  StartWorkoutBtn: {
    backgroundColor: '#00FF00',
    marginLeft: 15,
    marginRight: 15,
    borderRadius: 100,
  },
  StartBtnTxt: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  homeImage: {
    height: 512,
    width: 341,
  },
  HomeImgContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  EndBtnContainer: {
    paddingTop: 20,
  },
  endButton: {
    backgroundColor: '#FF0000',
    marginLeft: 15,
    marginRight: 15,
    borderRadius: 100,
  },
  EndButtonTxt: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  workoutMoveTitle: {
    fontSize: 20,
    textAlign: 'center',
    paddingTop: 20,
  },
  workoutMoveLink: {
    textAlign: 'center',
    textDecorationLine: 'underline',
    color: '#0000EE',
    marginBottom: 0,
  },
  input: {
    borderWidth: 1,
    textAlign: 'center',
    marginLeft: 60,
    marginRight: 60,
    marginTop: 15,
  },
  AddButton: {
    backgroundColor: '#00FF00',
    marginLeft: 100,
    marginRight: 100,
    borderRadius: 100,
    paddingTop: 8,
    paddingBottom: 8,
    marginTop: 10,
  },
  AddButtonTxt: {
    textAlign: 'center',
  },
  MovesSvContnet: {
    paddingBottom: 100,
  },
  selectWorkoutBtn: {
    backgroundColor: '#D3D3D3',
    borderRadius: 100,
    marginLeft: 10,
    marginRight: 10,
    marginTop: 10,
  },
  selectWorkoutBtnTxt: {
    textAlign: 'center',
    fontSize: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
});



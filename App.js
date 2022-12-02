import * as SQLite from "expo-sqlite";
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Alert, TextInput, RefreshControl } from 'react-native';
import React, { useState, useEffect } from 'react';
import { NavigationContainer, StackActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { differenceInMinutes, format, formatDuration, parseISO } from 'date-fns';

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
      <TouchableOpacity 
        style={styles.StartWorkoutBtn}
        onPress={this.onStart}
      >
        <Text style={styles.StartBtnTxt}>Start Workout</Text>
      </TouchableOpacity>
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
  

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        "create table if not exists workouts (id integer primary key not null, date text, startTime text, endTime text null, totalMinutes integer null);"
      );
      tx.executeSql(
        "create table if not exists moves (id integer primary key not null, workoutId integer, name text, sets integer, reps integer, difficulty integer);"
      );
    });
    this.showTables();
  }, []);

  showTables = () => {
    db.transaction(tx => {
      tx.executeSql("SHOW TABLES", [], (tx, results) => {
        var tableArray = [];
        for (let i = 0; i < results.rows.length; ++i) {
          tableArray.push(results.rows.item(i));
        }
        console.log(JSON.stringify(tableArray));
      });
    });
  }

  onSaveWorkout = (moveName) => {
    db.transaction(
      (tx) => {
        tx.executeSql("insert into workouts (date, startTime, endTime, totalMinutes) values (?, ?, ?, ?)`, [date, startTime, null, null]);");
        tx.executeSql("select * from workouts", [], (_, { rows }) =>
          console.log(rows)
        );
      },
      null,
    );

    this.onGetId(moveName);
  }

  onGetId = (moveName) => {
    db.transaction((tx) => {
      tx.executeSql("select id from workouts where date=? and startTime=?;",
      [date, startTime],
      (_, { rows: { _array } }) => setId(_array)
      );
    });

    console.log(id);
    this.onSaveMove(moveName);
  }

  onSaveMove = (moveName) => {
    db.transaction(
      (tx) => {
        tx.executeSql("insert into moves (workoutId, name, sets, reps, difficulty) values (?, ?, ?, ?, ?);`, [id[0].id, moveName, sets, reps, difficulty]);");
        tx.executeSql("select * from moves", [], (_, { rows }) =>
          moveConsole(rows)
        );
      },
      null,
    );
  }

  moveConsole = (rows) => {
    console.log(JSON.stringify(rows));
  }

  onAdd = (moveName) => {
    setName(moveName);
    var testMessage = "Date: " + date + " start time: " + startTime + " Name: " + moveName + " Sets: " + sets + " Reps: " + reps + " Difficulty: " + difficulty;
    this.onSaveWorkout(moveName);
  }

  onEnd = () => {
    var endTime = format(new Date(), 'HH:mm:ss');
    var tzoffset = (new Date()).getTimezoneOffset() * 60000;
    var isoEnd = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);
    //MIN DIFF WORKING DO NOT CHANGE
    var minDiff = differenceInMinutes(parseISO(isoEnd), parseISO(isoStart));
    console.log("Minutes:" + minDiff);

    this.onUpdateWorkout(endTime, minDiff);
  }

  onUpdateWorkout = (endTime, minDiff) => {
    db.transaction(
      (tx) => {
        tx.executeSql(`update workouts set endTime=?, totalMinutes=? where date=? and startTime=?;`, [endTime, minDiff, date, startTime]);
      },
      null,
    );

    navigation.navigate('Workouts');
  }

  return(
    <View style={styles.MovesContainer}>
      <TouchableOpacity
        style={styles.endButton}
        onPress={() => this.onEnd()}      
      >
        <Text style={styles.buttonTxt}>End Workout</Text>
      </TouchableOpacity>

      <Text style={styles.workoutMoveTitle}>Alternating Dumbbell Curl</Text>
      <Text style={styles.workoutMoveLink}>Link Text Goes Here</Text>
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
        style={styles.button}
        onPress={() => this.onAdd("Alternating Dumbbell Curl")}
      >
        <Text style={styles.buttonTxt}>Add to Workout</Text>
      </TouchableOpacity>

      <Text style={styles.workoutMoveTitle}>Hammer Dumbbell Curl</Text>
      <Text style={styles.workoutMoveLink}>Link Text Goes Here</Text>
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
        style={styles.button}
        onPress={() => this.onAdd("Hammer Dumbbell Curl")}
      >
        <Text style={styles.buttonTxt}>Add to Workout</Text>
      </TouchableOpacity>

      <Text style={styles.workoutMoveTitle}>Tricep Extension</Text>
      <Text style={styles.workoutMoveLink}>Link Text Goes Here</Text>
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
        style={styles.button}
        onPress={() => this.onAdd("Tricep Extension")}
      >
        <Text style={styles.buttonTxt}>Add to Workout</Text>
      </TouchableOpacity>
    </View>
  );
}

function WorkoutsScreen({route, navigation}){
  const [items, setItems] = useState(null);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        `select id, date, startTime, endTime, totalMinutes from workouts order by date desc;`,
        (_, { rows: { _array } }) => setItems(_array)
      );
    });
    console.log("items Array: " +items);
  }, []);

  // items.map below throws an error saying: null is not an object(evaluating 'items.map')
  // Im wondering if it has something to do with the way I did useEffect?
  // On this screen I am trying to display date and totalMinutes of all rows, eventually turning them into touchableOpacity
  // with an OnPress that takes you to the details of the specific workout you pressed (displaying all moves done during that workout)
  return(
    <View style={styles.workoutsContainer}>
      {/*
      {items.map(({ id, date, startTime, endTime, totalMinutes }) => (
        <Text>{date}, {totalMinutes}</Text>
      ))}
      */}
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
});


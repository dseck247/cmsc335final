const http = require("http");
const path = require("path");
const bodyParser = require("body-parser"); /* To handle post parameters */
const fs = require("fs");
const express = require("express");
const { table } = require("console");
const app = express();

/* Initializes request.body with post information */
app.use(bodyParser.urlencoded({ extended: false }));

//get the path to the .env
//require("dotenv").config({ path: path.resolve(__dirname, "./etc/secrets/.env") }); // which is in the .env

//MongoDB variables
const uri = `mongodb+srv://dseck335:dsmdb335@cluster0.lhkuicb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const databaseAndCollection = {db: "CMSC335_FINALDB", collection: "namesAndAges"};
const { MongoClient, ServerApiVersion } = require('mongodb');
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

app.use(bodyParser.urlencoded({ extended: false }));
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

// Terminal Prompts
if (process.argv.length !== 3) {
    process.stdout.write(`Usage ageify.js <PORT_NUMBER_HERE>`);
    process.exit(1);
  }
  // initialize the port number
  const portNumber = process.argv[2];
  console.log(portNumber);
  console.log(`Web server started and running at http://localhost:${portNumber}`);
 
  process.stdin.setEncoding("utf8"); // process standard output
 
  function promptUser() {
    const prompt = "Stop to shtudown the server: ";
    // write the prompt on the terminal
    process.stdout.write(prompt);
  }
  // process standard input
  process.stdin.on("data", (data) => {
    const command = data.trim();
 
    if (command === "stop" || command === "STOP") {
      console.log("Leaving so soon, bye bye!");
      console.log("Shutting down the server");
 
      process.exit(0);
    } else {
      promptUser();
    }
  });
 
  promptUser(); //Initiate prompt

// Main Page (where user enters name)
app.get("/", (request, response) => {
  response.render("frontEnd", {portNumber: portNumber});
});

// Second Page (table with name and age guess)
app.post("/age", async (request, response) => {
  let name = request.body.Name;
  let url = `https://api.agify.io?name=${name}`;
  let data = await fetch(url);
  let json = await data.json();
  let age = json.age;
  let variable = {
    name: name,
    age : age
  };
  let table = `<table border="1"><tr><th>Name</th><th>Age</th></tr>`;
  
  try{    
    await client.connect();
    //insert
    const result =  await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(variable);
    // retrieve
      console.log("result" + result);
    const cursor = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).find({});
    const collection =  await cursor.toArray();
    collection.forEach((element) => {
        table += `<tr><td>${element.name}</td><td>${element.age}</td></tr>`;
    });
    table+= `</table>`;
  } catch(e) {
    console.error(e);
  } finally {
    await client.close();
  }

  response.render("age", {table_result: table, portNumber: portNumber});
});

// Remove all Users From Database
app.post("/processRemove", async (req, res) => {
  let num;
  try {
    await client.connect();
    console.log("***** Removing all names *****");
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).deleteMany({});
    num = result.deletedCount;
    console.log(`Deleted applicants ${num}`);
  }catch(e) {
    console.error(e);
  }finally{
    await client.close();
  }
  res.render("processRemove", {numDeleted: num, portNumber: portNumber});
});

app.listen(portNumber);

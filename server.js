const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");

require("dotenv").config({ path: "variables.env" });

//Bring in GraphQl Express middleware
const { graphiqlExpress, graphqlExpress } = require("apollo-server-express");
const { makeExecutableSchema } = require("graphql-tools");

const Recipe = require("./models/Recipe");
const User = require("./models/User");

const { typeDefs } = require("./schema");
const { resolvers } = require("./resolvers.js");

const schema = makeExecutableSchema({
  typeDefs: typeDefs,
  resolvers: resolvers
});

//connects to database
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("DB connected");
  })
  .catch(err => {
    console.log(err);
  });

const app = express();

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true
};

app.use(cors(corsOptions));

// Set up JWT authentication middleware
app.use(async (req, res, next) => {
  const token = req.headers["authorization"];
  if (token !== "null") {
    try {
      const currentUser = await jwt.verify(token, process.env.SECRET);
      req.currentUser = currentUser;
    } catch (err) {
      console.error(err);
    }
  }
  next();
});

app.use(bodyParser.json());
// create Graphiql application
app.use("/graphiql", graphiqlExpress({ endpointURL: "/graphql" }));

//connect schemas with GrapghQL
app.use(
  "/graphql",
  graphqlExpress(({ currentUser }) => ({
    schema,
    context: {
      Recipe,
      User,
      currentUser
    }
  }))
);

const PORT = process.env.PORT || 4444;

app.listen(PORT, () => {
  console.log("listening POrt", PORT);
});

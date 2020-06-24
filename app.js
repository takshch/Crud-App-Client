const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const CONNECTION_URL = "mongodb://fidisys-api:!%403asflkj4%23sfslkms%23@ds129023.mlab.com:29023/heroku_s9zfc9ft";
const DATABASE_NAME = "fidisys-api";
const  COLLECTION_NAME = "items";

var app = Express();
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));
var database, collection;

var autoIncrement = require("mongodb-autoincrement");
const { response, request } = require("express");

app.listen(3000, () => {
    MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true }, (error, client) => {
        if(error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        collection = database.collection(COLLECTION_NAME);
        console.log("Connected to `" + DATABASE_NAME + "`!");
    });
});

app.get("/items", (request, response) => {
    collection.find({},{projection:{_id:0}}).toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);
    });
});


app.post("/add",(request,response)=>{
    if(("name" in request.body) && ("price" in request.body) && !isNaN(request.body.price)){
        getNextSequence(database, COLLECTION_NAME, function(err, result){
            if(!err){
                database.collection(COLLECTION_NAME).insertOne({id: result, ...request.body},(error,result)=>{
                    if(error){
                        return response.status(500).send(error);
                    } 
                    if(result.result.ok === 1){
                        response.send({status: "success", error: null});
                    }else{
                        response.send(result.result);
                    }
                });
            }
            else{
                response.send({error: "Something is not right!"});
            }
        });
    }else if(!("name" in request.body) || !("price" in request.body) || request.body.name === "" || request.body.price === ""){
        response.send({error: "fields are missing"});
    }else{
        response.send({error: "price must be number"});
    } 
});

app.post("/update",(req,response)=>{
    if(("id" in req.body) && ("price" in req.body) && req.body.id !== "" && req.body.price !== "" && !isNaN(req.body.id)  && !isNaN(req.body.price)){
        if(collection.find({id: req.body.id}).count() > 0){
            collection.updateOne({id: req.body.id},{$set:{price: req.body.price}},(error,result)=>{
                if(error){
                    response.send({error: "Something is not right!"});
                }
                else if(result){
                    response.send({status: "success",error: null});
                }
            });
        }else{
            response.send({error: "id doesn't exits"});
        }
    }else if(!("id" in req.body) || !("price" in req.body) || req.body.id === "" || req.body.price === ""){
        response.send({error: "fields are missing"});
    }
    else{
        response.send({error: "id and price must be number"});
    }
});

app.post("/delete",(req, response)=>{

    if(("id" in req.body) && !isNaN(req.body.id) && req.body.id !== ""){
        if(collection.find({id: req.body.id}).count() > 0){
            collection.deleteOne({id: req.body.id},(error,result)=>{
                if(error){
                    response.send({error: "Something is not right!"});
                }else if(result.deletedCount === 1){
                    response.send({status: "deleted",error: null});
                }
            });
        }else{
            response.send({error: "id doesn't exits"})
        }
    }else if(!("id" in req.body) || req.body.id === ""){
        response.send({error: "fields are missing"});
    }else{
        response.send({error: "id must be number"});
    }
});


//AutoIncrement Function for MongoDB.....
function getNextSequence(db, name, callback) {
    db.collection("counters").findAndModify( { _id: name }, null, { $inc: { seq: 1 } }, function(err, result){
        if(err) callback(err, result);
        callback(err, result.value.seq);
    } );
}
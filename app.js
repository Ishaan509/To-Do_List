//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _=require("lodash");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.URI);

const itemsSchema = new mongoose.Schema({
  name:String
});

const item = new mongoose.model('item' , itemsSchema);

const item1 = new item({
  name:"Welcome to your todolist!"
});

const item2 = new item({
  name:"Hit the + button to add a new item."
});

const item3 = new item({
  name:"<-- Hit this to delete an item."
});

const defaultItems = [item1,item2,item3];

const listSchema = new mongoose.Schema({
  name:String,
  items:[itemsSchema]
});

const List = new mongoose.model("List",listSchema);

app.get("/", function(req, res) {

  async function result(){
    const dbitems = await item.find({});
    console.log(dbitems);
    res.render("list", {listTitle: "Today", newListItems: dbitems});
  }
  result();

});

app.get("/:customListName", function(req,res){
  const customName = _.capitalize(req.params.customListName);

  const list = new List({
    name:customName,
    items: defaultItems
  });

  async function find(customName){
    const findres = await List.findOne({name:customName});
    if(findres == null){
      list.save();
      res.redirect("/" + customName);
    }
    else{
      res.render("list", {listTitle: findres.name, newListItems: findres.items});
    }
  }
  if(customName != "favicon.ico"){
    find(customName);
  }
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const newItem = new item({
    name:itemName
  });

  if(listName === "Today"){
    newItem.save();
    res.redirect("/");
  }else{
    async function findUpdate(listName,newItem) {
      const findUpdRes = await List.findOne({name:listName});
      if(findUpdRes != null){
        findUpdRes.items.push(newItem);
        findUpdRes.save();
        res.redirect("/" + listName);
      }
    }
    findUpdate(listName,newItem);
  }


});

app.post("/delete",(req,res)=>{
  const checked = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === "Today"){
    const del = async ()=>{
      const delres = await item.deleteOne({_id:checked});
      res.redirect("/");
    }
    del();
  }else{
    async function findUpdRem(listName, checked){
      const findDelRes = await List.findOneAndUpdate({name: listName} ,{$pull:{items:{_id: checked}}});
      res.redirect("/" + listName);
    }
    findUpdRem(listName, checked);
  }
});



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  if(process.env.PORT){console.log("Server started on port ",process.env.PORT);}
  else{console.log("Server started on port 3000");}
});

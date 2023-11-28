const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

//list
function list(req, res, next) {
  res.send({ data: dishes });
}

//does property exist in request?
function requiredField(prop) {
  return function (req, res, next) {
    if (req.body.data[prop]) {
      next();
    } else {
      next({
        status: 400,
        message: `${prop} property is required`,
      });
    }
  };
}

//does property contain an empty string?
function cannotBeEmptyString(prop) {
  return function (req, res, next) {
    if (req.body.data[prop].length > 0) {
      next();
    } else {
      next({
        status: 400,
        message: `${prop} must not be an empty value`,
      });
    }
  };
}

//is price greater than 0?
function priceGreaterThanZero(req, res, next) {
  const { price } = req.body.data;
  if (price > 0) {
    next();
  } else {
    next({
      status: 400,
      message: `price must be greater than 0`,
    });
  }
}

//is price an integer?
function priceIsAnInteger(req, res, next) {
  const { price } = req.body.data;
  if (Number.isInteger(price)) {
    next();
  } else {
    next({
      status: 400,
      message: `price must be an integer`,
    });
  }
}

//create
function create(req, res, next) {
  const { name, description, price, image_url } = req.body.data;
  //   console.log("LOOK HERE********************", req.body.data)
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  //   console.log("DISH CREATED WITH NEW DATA*********", res.body)
  res.status(201).send({ data: newDish });
}

//was the dish found?
function doesDishExist(req, res, next) {
  const { dishId } = req.params;
  //   console.log("DISH ID HERE*********", dishId)
  const foundDish = dishes.find((dish) => dish.id === dishId);
  //   console.log("FOUND DISH HERE*********", foundDish)
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  } else {
    next({
      status: 404,
      message: `dish id not found: ${dishId}`,
    });
  }
}

//read
function read(req, res, next) {
  res.send({ data: res.locals.dish });
}

module.exports = {
  list,
  create: [
    requiredField("name"),
    requiredField("description"),
    requiredField("image_url"),
    cannotBeEmptyString("name"),
    cannotBeEmptyString("description"),
    cannotBeEmptyString("image_url"),
    priceGreaterThanZero,
    priceIsAnInteger,
    create,
  ],
  read: [doesDishExist, read],
};

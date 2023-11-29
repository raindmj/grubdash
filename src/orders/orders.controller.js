const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req, res, next) {
  res.send({ data: orders });
}

//does property exist in request?
function requiredField(prop) {
  return function (req, res, next) {
    if (req.body.data[prop]) {
      next();
    } else {
      next({
        status: 400,
        message: `Order must include a ${prop}`,
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
        message: `Order must include a ${prop}`,
      });
    }
  };
}

//does dishes array exist?
function doesDishesArrayExist(req, res, next) {
  const { dishes } = req.body.data;
  if (dishes) {
    next();
  } else {
    next({
      status: 400,
      message: `Order must include a dish`,
    });
  }
}

function isDishesAnArrayWithAtLeastOneDish(req, res, next) {
  const { dishes } = req.body.data;
  if (Array.isArray(dishes) && dishes.length > 0) {
    next();
  } else {
    next({
      status: 400,
      message: "Order must include at least one dish",
    });
  }
}

function validateOrderQuantity(req, res, next) {
  const { dishes } = req.body.data;
  // Find index of first dish in dishes array that meets all conditions (does not address multiple dishes that don't meet conditions, use filter if need to do that)
  const indexOfDish = dishes.findIndex(
    (dish) =>
    // Look for the dish that doesn't satisfy any of the following conditions
      !(dish.quantity && Number.isInteger(dish.quantity) && dish.quantity > 0)
  );

//   console.log("INDEX OF DISH HERE*****************", indexOfDish)

  // Index === -1 if dish cannot be found
  if (indexOfDish === -1) {
    // All dishes are valid, proceed to the next middleware or route handler
    next();
  } else {
    // Found an invalid dish, send an error response
    next({
      status: 400,
      message: `Dish ${indexOfDish} must have a quantity that is an integer greater than 0`,
    });
  }
}

function create(req, res, next) {
  const { deliverTo, mobileNumber, status, dishes } = req.body.data;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };

  orders.push(newOrder);
  res.status(201).send({ data: newOrder });
}

module.exports = {
  list,
  create: [
    requiredField("deliverTo"),
    requiredField("mobileNumber"),
    cannotBeEmptyString("deliverTo"),
    cannotBeEmptyString("mobileNumber"),
    doesDishesArrayExist,
    isDishesAnArrayWithAtLeastOneDish,
    validateOrderQuantity,
    create,
  ],
};

const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

// LIST METHOD
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

// CREATE METHOD
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

function doesOrderExist(req, res, next) {
  const { orderId } = req.params;
  const orderIndex = orders.findIndex((order) => order.id === orderId);
  if (orderIndex !== -1) {
    res.locals.orderIndex = orderIndex;
    res.locals.order = orders[orderIndex];
    return next();
  } else {
    next({
      status: 404,
      message: `Order does not exist: ${orderId}`,
    });
  }
}

// READ METHOD
function read(req, res, next) {
  res.send({ data: res.locals.order });
}

function doesRouteIdMatchBodyId(req, res, next) {
  const { id } = req.body.data;
  //   console.log("ID HERE******************", id);
  const { orderId } = req.params;
  //   console.log("ID IN ROUTE HERE*********", dishId);
  if (id && id !== orderId) {
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
    });
  } else {
    next();
  }
}

function statusOfDelivered(req, res, next) {
  const { status } = req.body.data;
  if (status === "delivered") {
    next({
      status: 400,
      message: `A delivered order cannot be changed`,
    });
  } else {
    next();
  }
}

function isStatusValid(req, res, next) {
  const { status } = req.body.data;
  //   console.log("REQ BODY DATA FOR IS STATUS VALID****************", req.body.data);
  if (
    status &&
    status.length > 0 &&
    (status === "delivered" ||
      status === "pending" ||
      status === "preparing" ||
      status === "out-for-delivery")
  ) {
    next();
  } else {
    next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
  }
}

// UPDATE METHOD
function update(req, res, next) {
  const order = res.locals.order;
  const { deliverTo, mobileNumber, status, dishes } = req.body.data;

  //update order
  (order.deliverTo = deliverTo),
    (order.mobileNumber = mobileNumber),
    (order.status = status),
    (order.dishes = dishes);

  res.send({ data: order });
}

function orderMustBePending(req, res, next) {
  const status = res.locals.order.status;
//   console.log(res.locals.order)
  if (status !== "pending") {
    next({
      status: 400,
      message: `An order cannot be deleted unless it is pending.`,
    });
  } else {
    next();
  }
}

function destroy(req, res, next) {
  const { orderId } = req.params;
  const orderIndex = res.locals.orderIndex;
  if (orderIndex === -1) {
    next({
      status: 404,
      message: `No matching order found: ${orderId}`,
    });
  } else {
    orders.splice(orderIndex, 1);
    // console.log(`Order with order id ${orderId} deleted`);
    res.sendStatus(204);
  }
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
  read: [doesOrderExist, read],
  update: [
    doesOrderExist,
    requiredField("deliverTo"),
    requiredField("mobileNumber"),
    cannotBeEmptyString("deliverTo"),
    cannotBeEmptyString("mobileNumber"),
    doesRouteIdMatchBodyId,
    isStatusValid,
    statusOfDelivered,
    doesDishesArrayExist,
    isDishesAnArrayWithAtLeastOneDish,
    validateOrderQuantity,
    update,
  ],
  destroy: [doesOrderExist, orderMustBePending, destroy],
};

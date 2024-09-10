const { Order } = require("../model/Order");

exports.fetchOrdersByUser = async (req, res) => {
    const { id } = req.user;
    try {
      const orders = await Order.find({ user: id});
  
      res.status(200).json(orders);
    } catch (err) {
      res.status(400).json(err);
    }
  };
  
  exports.createOrder = async (req, res) => {
    const order = new Order(req.body);
    try {
      const doc = await order.save();
      res.status(201).json(doc);
    } catch (err) {
      res.status(400).json(err);
    }
  };
  
  exports.deleteOrder = async (req, res) => {
      const { id } = req.params;
      try {
      const order = await Order.findByIdAndDelete(id);
      res.status(200).json(order);
    } catch (err) {
      res.status(400).json(err);
    }
  };
  
  exports.updateOrder = async (req, res) => {
    const { id } = req.params;
    try {
      const order = await Order.findByIdAndUpdate(id, req.body, {
        new: true,
      });
      const result = await order.populate('user');
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json(err);
    }
  };


  exports.fetchAllOrders = async (req, res) => {
    // filter = {"category":["smartphone","laptops"]}
    // sort = {_sort:"price",_order="desc"}

    let condition = {};

    if(!req.query.admin){
      condition.deleted={$ne:true};
    }

  
    let query = Order.find(condition);
    let totalOrdersQuery = Order.find(condition);
    
    if (req.query._sort && req.query._order) {
      query = query.sort({ [req.query._sort]: req.query._order });
      // totalOrdersQuery = totalOrdersQuery.sort({ [req.query._sort]: req.query._order });
    }
  
    const totalDocs = await totalOrdersQuery.count().exec();
    console.log({totalDocs})
  
  
    if (req.query._page && req.query._limit) {
      const pageSize = req.query._limit;
      const page = req.query._page;
      query = query.skip(pageSize * (page - 1)).limit(pageSize);
      // totalOrdersQuery = totalOrdersQuery.skip(pageSize * (page - 1)).limit(pageSize);
    }
  

    try {
      const doc = await query.exec();
      res.set('X-Total-Count', totalDocs);
      res.status(201).json(doc);
    } catch (err) {
      res.status(400).json(err);
    }
  };



  
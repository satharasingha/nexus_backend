import Order from "../models/order.js"
import Product from "../models/product.js"

export default async function createOrder(req,res){

    const user = req.user

    if(user == null){
        res.status(401).json({
            message : "You need to be logged in to place an order"
        })
        return
    }

    //let orderId = "ORD00000001"

    const orderData = {
        orderId : "ORD00000001",
        email : user.email,
        firstName : user.firstName,
        lastName : user.lastName,
        addressLineOne : req.body.addressLineOne,
        adressLineTwo : req.body.adressLineTwo,
        city : req.body.city,
        state : req.body.state,
        postalCode : req.body.postalCode,
        phone : req.body.phone,
        total : 0,
        items : []
    }

    if(req.body.firstName != null && req.body.firstName !=""){
        orderData.firstName = req.body.firstName
    }

    if(req.body.lastName != null && req.body.lastName !=""){
        orderData.lastName = req.body.lastName
    }

    try{

        const lastOrder = await Order.findOne().sort({ date: -1 })

        if(lastOrder != null){
            //ORD00000039
            const lastOrderId = lastOrder.orderId //"ORD00000039"

            const lastOrderNumberInString = lastOrderId.replace("ORD", "") //"00000039"

            const lastOrderNumber = parseInt(lastOrderNumberInString) //39

            const newOrderNumber = lastOrderNumber + 1 //40

            const newOrderNumberInString = newOrderNumber.toString().padStart(8, "0") //"00000040"

            orderData.orderId = "ORD" + newOrderNumberInString //"ORD00000040"

        }

        /*
        {productId : "PROD00000001", quantity : 2}
        */

        for(let i = 0; i < req.body.items.length; i++){

            const product = await Product.findOne({productId : req.body.items[i].productId})
            //if(product == null || !product.isAvailable || product.stock < req.body.items[i].quantity)
            if(product == null || !product.isAvailable){
                res.status(400).json({
                    message : "Product with productId " + req.body.items[i].productId + " not found. Please place your order without this product."
                })
                return
            }else{

                orderData.items.push({
                    product : {
                        productId : product.productId,
                        name : product.name,
                        price : product.price,
                        labelledPrice : product.labelledPrice,
                        image : product.images[0]
                    },
                    quantity : req.body.items[i].quantity
                })

                orderData.total += product.price * req.body.items[i].quantity
            }

        }

        const newOrder = new Order(orderData)

        const result = await newOrder.save()

        // Reduce stock of products

        // for(let i = 0; i < orderData.items.length; i++){
        //     await Product.findOneAndUpdate(
        //         { productId : orderData.items[i].product.productId },
        //         { $inc : { stock : -orderData.items[i].quantity } }
        //     )
        // }

        console.log(result)

        res.status(201).json({
            message : "Order placed successfully"
        })

    }catch(error){
        console.log(error)
        res.status(500).json({
            message : "Error creating order"
        })
    }
}

export async function getOrders(req,res){

    try{
        if(req.user == null){
            res.status(401).json({
                message : "You need to be logged in to view your orders"
            })
            return
        }

        const pageSizeInString = req.params.pageSize|| "10"   //"10"
        const pageNumberInString = req.params.pageNumber || "1"   //"12"

        const pageSize = parseInt(pageSizeInString) //10
        const pageNumber = parseInt(pageNumberInString) //12``
        
        if(pageSize < 1 || pageSize > 100){
            res.status(400).json({
                message : "pageSize should be between 1 and 100"
            })
             return
        }

        

        if(req.user.isAdmin){

            const orderCount = await Order.countDocuments()

            const totalPages = Math.ceil(orderCount / pageSize)
          
            const orders = await Order.find().sort({ date : -1 }).skip( (pageNumber -1) * pageSize ).limit(pageSize)

            res.status(200).json({
                orders : orders,
                totalPages : totalPages,
                total : orderCount
            })

        }else{

            const orderCount = await Order.countDocuments({ email : req.user.email })

            const totalPages = Math.ceil(orderCount / pageSize)

            const orders = await Order.find({ email : req.user.email }).sort({ date : -1 }).skip( (pageNumber -1) * pageSize ).limit(pageSize)

            res.status(200).json({
                orders : orders,
                totalPages : totalPages,
                total : orderCount
            })

        }

    }catch(error){
        console.log(error)
        res.status(500).json({
            message : "Error fetching orders"
        })
    }
    
}

export async function updateOrderStatusAndNotes(req,res){
    
    if(req.user && req.user.isAdmin){
        try{

            const orderId = req.params.orderId

            await Order.findOneAndUpdate(
                { orderId : orderId },
                { status : req.body.status, notes : req.body.notes }
            )
            res.status(200).json({
                message : "Order status and notes updated successfully"
            })

        }catch(error){
            console.log(error)
            res.status(500).json({
                message : "Error updating order status and notes"
            })
        }
    }else{
        res.status(403).json({
            message : "You are not authorized to perform this action"
        })
    }
    
}
import Product from "../models/product.js";
import { isAdmin } from "./userController.js";

export async function createProduct(req, res) {
	if (!isAdmin(req)) {
		res.status(403).json({
			message: "Access denied. Admins only.",
		});
		return;
	}

	try {
		const existingProduct = await Product.findOne({
			productId: req.body.productId,
		});

		if (existingProduct != null) {
			res.status(400).json({
				message: "Product with this productId already exists.",
			});
			return;
		}

		const newProduct = new Product({
			productId: req.body.productId,
			name: req.body.name,
			altNames: req.body.altNames,
			price: req.body.price,
			labelledPrice: req.body.labelledPrice,
			description: req.body.description,
			images: req.body.images,
			brand: req.body.brand,
			model: req.body.model,
			category: req.body.category,
			stock: req.body.stock,
		});

		await newProduct.save();

		res.status(201).json({
			message: "Product created successfully.",
		});
	} catch (error) {
		res.status(500).json({
			message: "Error creating product",
		});
	}
}

export async function getAllProducts(req, res) {
    console.log("Fetching products....")
	try {
		if (isAdmin(req)) {
			const products = await Product.find();

			res.json(products);
		}else {
            const products = await Product.find({ isAvailable: true });
            res.json(products);
        }
	} catch (error) {
		res.status(500).json({
			message: "Error fetching products",
		});
	}
}

export async function deleteProduct(req, res) {
    if (!isAdmin(req)) {
        res.status(403).json({
            message: "Access denied. Admins only.",
        });
        return;
    }

    try{

        await Product.deleteOne({
            productId : req.params.productId
        })
        res.json({
            message: "Product deleted successfully.",
        });
        
    }catch(error){
        res.status(500).json({
            message: "Error deleting product",
        });
    }
}

export async function updateProduct(req,res){
    if (!isAdmin(req)) {
        res.status(403).json({
            message: "Access denied. Admins only.",
        });
        return;
    }

    try{

        await Product.updateOne({
            productId : req.params.productId
        },{
            name : req.body.name,
            altNames : req.body.altNames,
            price : req.body.price,
            labelledPrice : req.body.labelledPrice,
            description : req.body.description,
            images : req.body.images,
            brand : req.body.brand,
            model : req.body.model,
            category : req.body.category,
            stock : req.body.stock,
            isAvailble : req.body.isAvailble
        })

        res.json({
            message: "Product updated successfully."
        });
    }catch(error){
        res.status(500).json({
            message: "Error updating product",
        });
    }
}

export async function getProductById(req,res){
    try{
        const product = await Product.findOne({
            productId : req.params.productId
        })
        if(product == null){
            res.status(404).json({
                message : "Product not found"
            })
        }else{
            if(product.isAvailable){
                res.json(product)
            }else{
                if(isAdmin(req)){
                    res.json(product)
                }else{
                    res.status(403).json({
                        message : "Access denied. Admins only."
                    })
                }
            }
        }   
    }catch(error){
        res.status(500).json({
            message: "Error fetching product",
        });
    }
}
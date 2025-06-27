from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pydantic import BaseModel, Field
from typing import Optional, List
import os
import jwt
import bcrypt
from datetime import datetime, timedelta
import uuid
from bson import ObjectId
import json
from bson.json_util import dumps, loads

# Database connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URL)
db = client.techhub_db

# Collections
users_collection = db.users
products_collection = db.products
cart_collection = db.cart
orders_collection = db.orders

# FastAPI app
app = FastAPI(title="TechHub E-commerce API")

# Security
security = HTTPBearer()
SECRET_KEY = "your-secret-key-here"  # In production, use environment variable

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password: str
    name: str
    role: str = "user"  # "user" or "admin"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    email: str
    password: str
    name: str

class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    image_url: str
    category: str
    stock: int
    specifications: dict = {}

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    image_url: str
    category: str
    stock: int
    specifications: dict = {}

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    stock: Optional[int] = None
    specifications: Optional[dict] = None

class CartItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    product_id: str
    quantity: int
    added_at: datetime = Field(default_factory=datetime.utcnow)

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[dict]
    total_amount: float
    status: str = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class OrderStatusUpdate(BaseModel):
    status: str

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str) -> str:
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def verify_admin(token_payload: dict = Depends(verify_token)):
    if token_payload.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    return token_payload['user_id']

def get_current_user_id(token_payload: dict = Depends(verify_token)):
    return token_payload['user_id']

# Initialize sample products
@app.on_event("startup")
async def startup_event():
    # Check if products already exist
    if products_collection.count_documents({}) == 0:
        sample_products = [
            {
                "id": str(uuid.uuid4()),
                "name": "iPhone 15 Pro",
                "description": "The latest iPhone with advanced camera system and titanium design",
                "price": 999.99,
                "image_url": "https://images.unsplash.com/photo-1499097828500-fac38e25d327",
                "category": "smartphones",
                "stock": 50,
                "specifications": {
                    "display": "6.1-inch Super Retina XDR",
                    "processor": "A17 Pro chip",
                    "storage": "128GB",
                    "camera": "48MP main camera"
                }
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Samsung Galaxy S24",
                "description": "Premium Android smartphone with AI-powered features",
                "price": 899.99,
                "image_url": "https://images.unsplash.com/photo-1592890288564-76628a30a657",
                "category": "smartphones",
                "stock": 30,
                "specifications": {
                    "display": "6.2-inch Dynamic AMOLED",
                    "processor": "Snapdragon 8 Gen 3",
                    "storage": "256GB",
                    "camera": "50MP triple camera"
                }
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Sony WH-1000XM5",
                "description": "Industry-leading noise canceling wireless headphones",
                "price": 399.99,
                "image_url": "https://images.unsplash.com/photo-1598327105679-d1e69b1f9818",
                "category": "audio",
                "stock": 25,
                "specifications": {
                    "type": "Over-ear",
                    "connectivity": "Bluetooth 5.2",
                    "battery": "30 hours",
                    "noise_cancellation": "Active"
                }
            },
            {
                "id": str(uuid.uuid4()),
                "name": "MacBook Pro 16-inch",
                "description": "Powerful laptop with M3 Pro chip for professional work",
                "price": 2499.99,
                "image_url": "https://images.unsplash.com/photo-1552585155-f5c1efa32555",
                "category": "laptops",
                "stock": 15,
                "specifications": {
                    "processor": "Apple M3 Pro",
                    "memory": "18GB unified memory",
                    "storage": "512GB SSD",
                    "display": "16.2-inch Liquid Retina XDR"
                }
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Canon EOS R5",
                "description": "Professional mirrorless camera with 8K video recording",
                "price": 3899.99,
                "image_url": "https://images.pexels.com/photos/2858481/pexels-photo-2858481.jpeg",
                "category": "cameras",
                "stock": 10,
                "specifications": {
                    "sensor": "45MP full-frame CMOS",
                    "video": "8K RAW recording",
                    "autofocus": "1053 AF points",
                    "image_stabilization": "5-axis"
                }
            },
            {
                "id": str(uuid.uuid4()),
                "name": "LG OLED55C3PUA",
                "description": "55-inch 4K OLED Smart TV with AI-powered processor",
                "price": 1299.99,
                "image_url": "https://images.unsplash.com/photo-1717295248358-4b8f2c8989d6",
                "category": "televisions",
                "stock": 20,
                "specifications": {
                    "size": "55 inches",
                    "resolution": "4K OLED",
                    "smart_tv": "webOS 23",
                    "hdr": "HDR10, Dolby Vision"
                }
            }
        ]
        products_collection.insert_many(sample_products)

# API Routes

# Auth routes
@app.post("/api/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    if users_collection.find_one({"email": user_data.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if this is the first user (make them admin)
    user_count = users_collection.count_documents({})
    role = "admin" if user_count == 0 else "user"
    
    # Create user
    user = User(
        email=user_data.email,
        password=hash_password(user_data.password),
        name=user_data.name,
        role=role
    )
    
    users_collection.insert_one(user.dict())
    token = create_token(user.id, user.role)
    
    return {
        "message": "User registered successfully",
        "token": token,
        "user": {"id": user.id, "email": user.email, "name": user.name, "role": user.role}
    }

@app.post("/api/auth/login")
async def login(user_data: UserLogin):
    user = users_collection.find_one({"email": user_data.email})
    
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["role"])
    
    return {
        "message": "Login successful",
        "token": token,
        "user": {"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]}
    }

@app.get("/api/auth/me")
async def get_current_user(user_id: str = Depends(get_current_user_id)):
    user = users_collection.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]}

# Product routes
@app.get("/api/products")
async def get_products(category: Optional[str] = None, search: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    products = list(products_collection.find(query))
    # Convert ObjectId to string for JSON serialization
    for product in products:
        if '_id' in product:
            product['_id'] = str(product['_id'])
    return products

@app.get("/api/products/{product_id}")
async def get_product(product_id: str):
    product = products_collection.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    # Convert ObjectId to string for JSON serialization
    if '_id' in product:
        product['_id'] = str(product['_id'])
    return product

@app.get("/api/categories")
async def get_categories():
    categories = products_collection.distinct("category")
    return categories

# Admin Product Management Routes
@app.post("/api/admin/products")
async def create_product(product_data: ProductCreate, admin_id: str = Depends(verify_admin)):
    product = Product(**product_data.dict())
    products_collection.insert_one(product.dict())
    return {"message": "Product created successfully", "product_id": product.id}

@app.put("/api/admin/products/{product_id}")
async def update_product(product_id: str, product_data: ProductUpdate, admin_id: str = Depends(verify_admin)):
    update_data = {k: v for k, v in product_data.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = products_collection.update_one({"id": product_id}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product updated successfully"}

@app.delete("/api/admin/products/{product_id}")
async def delete_product(product_id: str, admin_id: str = Depends(verify_admin)):
    result = products_collection.delete_one({"id": product_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product deleted successfully"}

# Admin Order Management Routes
@app.get("/api/admin/orders")
async def get_all_orders(admin_id: str = Depends(verify_admin)):
    orders = list(orders_collection.find({}).sort("created_at", -1))
    # Convert ObjectId to string for JSON serialization
    for order in orders:
        if '_id' in order:
            order['_id'] = str(order['_id'])
        # Get user info for each order
        user = users_collection.find_one({"id": order["user_id"]})
        if user:
            order["user_name"] = user["name"]
            order["user_email"] = user["email"]
    return orders

@app.put("/api/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, status_data: OrderStatusUpdate, admin_id: str = Depends(verify_admin)):
    result = orders_collection.update_one(
        {"id": order_id}, 
        {"$set": {"status": status_data.status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order status updated successfully"}

# Admin User Management Routes
@app.get("/api/admin/users")
async def get_all_users(admin_id: str = Depends(verify_admin)):
    users = list(users_collection.find({}, {"password": 0}))  # Exclude password
    # Convert ObjectId to string for JSON serialization
    for user in users:
        if '_id' in user:
            user['_id'] = str(user['_id'])
    return users

# Admin Dashboard Routes
@app.get("/api/admin/dashboard")
async def get_dashboard_stats(admin_id: str = Depends(verify_admin)):
    # Get basic stats
    total_users = users_collection.count_documents({})
    total_products = products_collection.count_documents({})
    total_orders = orders_collection.count_documents({})
    
    # Get pending orders
    pending_orders = orders_collection.count_documents({"status": "pending"})
    
    # Get total revenue
    pipeline = [
        {"$group": {"_id": None, "total_revenue": {"$sum": "$total_amount"}}}
    ]
    revenue_result = list(orders_collection.aggregate(pipeline))
    total_revenue = revenue_result[0]["total_revenue"] if revenue_result else 0
    
    # Get recent orders
    recent_orders = list(orders_collection.find({}).sort("created_at", -1).limit(5))
    for order in recent_orders:
        if '_id' in order:
            order['_id'] = str(order['_id'])
        user = users_collection.find_one({"id": order["user_id"]})
        if user:
            order["user_name"] = user["name"]
    
    # Get low stock products
    low_stock_products = list(products_collection.find({"stock": {"$lt": 10}}))
    for product in low_stock_products:
        if '_id' in product:
            product['_id'] = str(product['_id'])
    
    return {
        "total_users": total_users,
        "total_products": total_products,
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "total_revenue": total_revenue,
        "recent_orders": recent_orders,
        "low_stock_products": low_stock_products
    }

# Cart routes
@app.post("/api/cart/add")
async def add_to_cart(product_id: str, quantity: int = 1, user_id: str = Depends(get_current_user_id)):
    # Check if product exists
    product = products_collection.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if item already in cart
    existing_item = cart_collection.find_one({"user_id": user_id, "product_id": product_id})
    
    if existing_item:
        # Update quantity
        cart_collection.update_one(
            {"user_id": user_id, "product_id": product_id},
            {"$inc": {"quantity": quantity}}
        )
    else:
        # Add new item
        cart_item = CartItem(
            user_id=user_id,
            product_id=product_id,
            quantity=quantity
        )
        cart_collection.insert_one(cart_item.dict())
    
    return {"message": "Item added to cart"}

@app.get("/api/cart")
async def get_cart(user_id: str = Depends(get_current_user_id)):
    cart_items = list(cart_collection.find({"user_id": user_id}))
    
    # Get product details for each cart item
    cart_with_products = []
    for item in cart_items:
        # Convert ObjectId to string
        if '_id' in item:
            item['_id'] = str(item['_id'])
            
        product = products_collection.find_one({"id": item["product_id"]})
        if product:
            # Convert product ObjectId to string
            if '_id' in product:
                product['_id'] = str(product['_id'])
                
            cart_with_products.append({
                "id": item["id"],
                "product": product,
                "quantity": item["quantity"],
                "added_at": item["added_at"]
            })
    
    return cart_with_products

@app.put("/api/cart/{cart_item_id}")
async def update_cart_item(cart_item_id: str, quantity: int, user_id: str = Depends(get_current_user_id)):
    if quantity <= 0:
        cart_collection.delete_one({"id": cart_item_id, "user_id": user_id})
        return {"message": "Item removed from cart"}
    
    cart_collection.update_one(
        {"id": cart_item_id, "user_id": user_id},
        {"$set": {"quantity": quantity}}
    )
    return {"message": "Cart updated"}

@app.delete("/api/cart/{cart_item_id}")
async def remove_from_cart(cart_item_id: str, user_id: str = Depends(get_current_user_id)):
    cart_collection.delete_one({"id": cart_item_id, "user_id": user_id})
    return {"message": "Item removed from cart"}

@app.delete("/api/cart")
async def clear_cart(user_id: str = Depends(get_current_user_id)):
    cart_collection.delete_many({"user_id": user_id})
    return {"message": "Cart cleared"}

# Order routes
@app.post("/api/orders")
async def create_order(user_id: str = Depends(get_current_user_id)):
    # Get cart items
    cart_items = list(cart_collection.find({"user_id": user_id}))
    
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Calculate total and prepare order items
    total_amount = 0
    order_items = []
    
    for item in cart_items:
        product = products_collection.find_one({"id": item["product_id"]})
        if product:
            item_total = product["price"] * item["quantity"]
            total_amount += item_total
            order_items.append({
                "product_id": product["id"],
                "name": product["name"],
                "price": product["price"],
                "quantity": item["quantity"],
                "total": item_total
            })
    
    # Create order
    order = Order(
        user_id=user_id,
        items=order_items,
        total_amount=total_amount
    )
    
    orders_collection.insert_one(order.dict())
    
    # Clear cart
    cart_collection.delete_many({"user_id": user_id})
    
    return {"message": "Order created successfully", "order_id": order.id, "total": total_amount}

@app.get("/api/orders")
async def get_orders(user_id: str = Depends(get_current_user_id)):
    orders = list(orders_collection.find({"user_id": user_id}).sort("created_at", -1))
    # Convert ObjectId to string for JSON serialization
    for order in orders:
        if '_id' in order:
            order['_id'] = str(order['_id'])
    return orders

@app.get("/api/orders/{order_id}")
async def get_order(order_id: str, user_id: str = Depends(get_current_user_id)):
    order = orders_collection.find_one({"id": order_id, "user_id": user_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    # Convert ObjectId to string for JSON serialization
    if '_id' in order:
        order['_id'] = str(order['_id'])
    return order

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
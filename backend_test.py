import requests
import json
import uuid
import time
from typing import Dict, Any, List, Optional

# Base URL from frontend/.env (REACT_APP_BACKEND_URL)
BASE_URL = "http://localhost:8001/api"

# Test data
TEST_USER = {
    "email": f"test.user.{uuid.uuid4()}@example.com",
    "password": "SecurePassword123!",
    "name": "Test User"
}

# Global variables to store test data
auth_token = None
user_data = None
product_id = None
cart_item_id = None
order_id = None

def print_test_header(test_name: str) -> None:
    """Print a formatted test header."""
    print(f"\n{'=' * 80}")
    print(f"TEST: {test_name}")
    print(f"{'=' * 80}")

def print_response(response: requests.Response) -> None:
    """Print formatted response details."""
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response: {response.text}")

def test_user_registration() -> bool:
    """Test user registration endpoint."""
    global auth_token, user_data
    
    print_test_header("User Registration")
    
    url = f"{BASE_URL}/auth/register"
    response = requests.post(url, json=TEST_USER)
    print_response(response)
    
    if response.status_code == 200:
        data = response.json()
        auth_token = data.get("token")
        user_data = data.get("user")
        return True
    return False

def test_user_login() -> bool:
    """Test user login endpoint."""
    global auth_token, user_data
    
    print_test_header("User Login")
    
    url = f"{BASE_URL}/auth/login"
    login_data = {
        "email": TEST_USER["email"],
        "password": TEST_USER["password"]
    }
    
    response = requests.post(url, json=login_data)
    print_response(response)
    
    if response.status_code == 200:
        data = response.json()
        auth_token = data.get("token")
        user_data = data.get("user")
        return True
    return False

def test_get_current_user() -> bool:
    """Test get current user endpoint."""
    print_test_header("Get Current User")
    
    url = f"{BASE_URL}/auth/me"
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    response = requests.get(url, headers=headers)
    print_response(response)
    
    return response.status_code == 200

def test_get_products() -> bool:
    """Test get products endpoint."""
    global product_id
    
    print_test_header("Get Products")
    
    url = f"{BASE_URL}/products"
    response = requests.get(url)
    print_response(response)
    
    if response.status_code == 200:
        products = response.json()
        if products and len(products) > 0:
            product_id = products[0]["id"]
            return True
    return False

def test_get_product_by_id() -> bool:
    """Test get product by ID endpoint."""
    print_test_header("Get Product by ID")
    
    url = f"{BASE_URL}/products/{product_id}"
    response = requests.get(url)
    print_response(response)
    
    return response.status_code == 200

def test_get_products_with_category() -> bool:
    """Test get products with category filter."""
    print_test_header("Get Products with Category Filter")
    
    url = f"{BASE_URL}/products?category=smartphones"
    response = requests.get(url)
    print_response(response)
    
    return response.status_code == 200

def test_get_products_with_search() -> bool:
    """Test get products with search query."""
    print_test_header("Get Products with Search Query")
    
    url = f"{BASE_URL}/products?search=iPhone"
    response = requests.get(url)
    print_response(response)
    
    return response.status_code == 200

def test_get_categories() -> bool:
    """Test get categories endpoint."""
    print_test_header("Get Categories")
    
    url = f"{BASE_URL}/categories"
    response = requests.get(url)
    print_response(response)
    
    return response.status_code == 200

def test_add_to_cart() -> bool:
    """Test add to cart endpoint."""
    print_test_header("Add to Cart")
    
    url = f"{BASE_URL}/cart/add?product_id={product_id}&quantity=2"
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    response = requests.post(url, headers=headers)
    print_response(response)
    
    return response.status_code == 200

def test_get_cart() -> bool:
    """Test get cart endpoint."""
    global cart_item_id
    
    print_test_header("Get Cart")
    
    url = f"{BASE_URL}/cart"
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    response = requests.get(url, headers=headers)
    print_response(response)
    
    if response.status_code == 200:
        cart_items = response.json()
        if cart_items and len(cart_items) > 0:
            cart_item_id = cart_items[0]["id"]
            return True
    return False

def test_update_cart_item() -> bool:
    """Test update cart item endpoint."""
    print_test_header("Update Cart Item")
    
    url = f"{BASE_URL}/cart/{cart_item_id}?quantity=3"
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    response = requests.put(url, headers=headers)
    print_response(response)
    
    return response.status_code == 200

def test_remove_from_cart() -> bool:
    """Test remove from cart endpoint."""
    print_test_header("Remove from Cart")
    
    # First add another item to cart
    add_url = f"{BASE_URL}/cart/add?product_id={product_id}&quantity=1"
    headers = {"Authorization": f"Bearer {auth_token}"}
    add_response = requests.post(add_url, headers=headers)
    
    # Get cart to find the new item
    get_url = f"{BASE_URL}/cart"
    get_response = requests.get(get_url, headers=headers)
    
    if get_response.status_code == 200:
        cart_items = get_response.json()
        if cart_items and len(cart_items) > 0:
            new_item_id = cart_items[0]["id"]
            
            # Remove the item
            url = f"{BASE_URL}/cart/{new_item_id}"
            response = requests.delete(url, headers=headers)
            print_response(response)
            
            return response.status_code == 200
    return False

def test_create_order() -> bool:
    """Test create order endpoint."""
    global order_id
    
    print_test_header("Create Order")
    
    # First make sure we have something in the cart
    add_url = f"{BASE_URL}/cart/add?product_id={product_id}&quantity=1"
    headers = {"Authorization": f"Bearer {auth_token}"}
    requests.post(add_url, headers=headers)
    
    # Create order
    url = f"{BASE_URL}/orders"
    response = requests.post(url, headers=headers)
    print_response(response)
    
    if response.status_code == 200:
        data = response.json()
        order_id = data.get("order_id")
        return True
    return False

def test_get_orders() -> bool:
    """Test get orders endpoint."""
    print_test_header("Get Orders")
    
    url = f"{BASE_URL}/orders"
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    response = requests.get(url, headers=headers)
    print_response(response)
    
    return response.status_code == 200

def test_get_order_by_id() -> bool:
    """Test get order by ID endpoint."""
    print_test_header("Get Order by ID")
    
    url = f"{BASE_URL}/orders/{order_id}"
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    response = requests.get(url, headers=headers)
    print_response(response)
    
    return response.status_code == 200

def test_clear_cart() -> bool:
    """Test clear cart endpoint."""
    print_test_header("Clear Cart")
    
    # First add something to cart
    add_url = f"{BASE_URL}/cart/add?product_id={product_id}&quantity=1"
    headers = {"Authorization": f"Bearer {auth_token}"}
    requests.post(add_url, headers=headers)
    
    # Clear cart
    url = f"{BASE_URL}/cart"
    response = requests.delete(url, headers=headers)
    print_response(response)
    
    return response.status_code == 200

def run_all_tests() -> Dict[str, bool]:
    """Run all tests and return results."""
    results = {}
    
    # User Authentication Tests
    results["User Registration"] = test_user_registration()
    results["User Login"] = test_user_login()
    results["Get Current User"] = test_get_current_user()
    
    # Product Management Tests
    results["Get Products"] = test_get_products()
    results["Get Product by ID"] = test_get_product_by_id()
    results["Get Products with Category"] = test_get_products_with_category()
    results["Get Products with Search"] = test_get_products_with_search()
    results["Get Categories"] = test_get_categories()
    
    # Shopping Cart Tests
    results["Add to Cart"] = test_add_to_cart()
    results["Get Cart"] = test_get_cart()
    results["Update Cart Item"] = test_update_cart_item()
    results["Remove from Cart"] = test_remove_from_cart()
    
    # Order Management Tests
    results["Create Order"] = test_create_order()
    results["Get Orders"] = test_get_orders()
    results["Get Order by ID"] = test_get_order_by_id()
    
    # Additional Cart Test
    results["Clear Cart"] = test_clear_cart()
    
    return results

def print_summary(results: Dict[str, bool]) -> None:
    """Print a summary of test results."""
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    passed = 0
    failed = 0
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        if result:
            passed += 1
        else:
            failed += 1
        print(f"{test_name}: {status}")
    
    print("-" * 80)
    print(f"TOTAL: {len(results)} | PASSED: {passed} | FAILED: {failed}")
    print("=" * 80)

if __name__ == "__main__":
    print("Starting TechHub E-commerce Backend API Tests")
    print(f"Base URL: {BASE_URL}")
    
    results = run_all_tests()
    print_summary(results)
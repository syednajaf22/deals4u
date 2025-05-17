const products = [
    {
        id: 1,
        name: 'AirPods Pro',
        price: 2799,
        costPrice: 1899,
        category: 'Electronics',
        rating: 5.0,
        image: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/MQD83?wid=572&hei=572&fmt=jpeg&qlt=95&.v=1660803972361',
        available: true,
        description:
            'Experience immersive sound with active noise cancellation and transparency mode. Features include adaptive EQ, spatial audio, and sweat resistance.',
        specs: [
            'Active Noise Cancellation',
            'Transparency Mode',
            'Spatial Audio',
            '24H Battery Life'
        ],
        reviews: [
            {
                user: 'John D.',
                rating: 5,
                comment: "Best earbuds I've ever owned!"
            },
            {
                user: 'Sarah M.',
                rating: 5,
                comment: 'Great sound quality and battery life'
            }
        ],
        colors: ['White'],
        stock: 50
    },
    {
        id: 2,
        name: 'Portable Blender',
        price: 2499,
        costPrice: 1799,
        category: 'Home',
        rating: 5.0,
        image: 'https://www.neshtary.com/cdn/shop/products/H8bb9047571ea457c88e18e7b0705fc506.jpg?v=1655983248',
        available: true,
        description:
            "Portable Blender carry it anywhere with you.",
        specs: [
            'Portable Blender',
            'Rechargeable',
        
        ],
        reviews: [
            {
                user: 'Ali',
                rating: 5,
                comment: 'Perfect for carrying'
            },
            { user: 'Ahmad.', rating: 5, comment: 'Amazing battery life!' }
        ],
        colors: ['Space Gray', 'Silver', 'Gold'],
        stock: 25
    },
    {
        id: 3,
        name: 'Watch with Airpods',
        price: 3599,
        costPrice: 2699,
        category: 'Electronics',
        rating: 4.8,
        image: 'https://crazevalue.pk/wp-content/uploads/2024/03/Combo.jpg',
        available: true,
        description:
            'Experience Smart Watch with Airpods on 20% Discount.',
        specs: [
            '6.4-inch OLED display',
            '128GB Storage',
            'Waterproof',
            'Airpods Second Generation as a Gift'
        ],
        reviews: [
            {
                user: 'David W.',
                rating: 4.8,
                comment: 'Best Android experience'
            },
            { user: 'Emma S.', rating: 4.7, comment: 'Amazing camera quality' }
        ],
        colors: ['Sage', 'Black', 'White'],
        stock: 30
    },
    {
        id: 4,
        name: 'P9 Headphones',
        price: 2299,
        costPrice: 1799,
        category: 'Electronics',
        rating: 4.9,
        image: 'https://appleman.pk/cdn/shop/products/Model-P9-Headphone-1.jpg?v=1667812000',
        available: true,
        description:
            'Best high Quality New Generation Headphones.',
        specs: ['1st Copy Headphones', 'Metal Body', 'Best Sound Output', '2 days Battery Backup'],
        reviews: [
            {
                user: 'Haider',
                rating: 5,
                comment: 'Sound is Amzing'
            },
            {
                user: 'Alia.',
                rating: 4.8,
                comment: 'Amazing sound'
            }
        ],
        colors: ['White'],
        stock: 15
    },
    {
        id: 5,
        name: 'Murshad',
        price: 2799,
        costPrice: 1899,
        category: 'Fashion',
        rating: 4.7,
        image: 'https://www.tawakkalperfumes.co.uk/cdn/shop/files/murshad1080x1080_1.jpg?v=1739892612',
        available: true,
        description:
            "Murshad 804 Inspired by Imran Khan Ex Prime Minister of Pakistan",
        specs: [
            'Inspired by Imran Khan',
            'Long Lasting Fragrance',
        
        ],
        reviews: [
            {
                user: 'Ali Ameen',
                rating: 4.7,
                comment: 'Long Lasting Fragrance'
            },
            {
                user: 'Ahmad',
                rating: 4.8,
                comment: 'Amazing Perfume'
            }
        ],
        colors: ['Black', 'White', 'Red'],
        sizes: ['US 7', 'US 8', 'US 9', 'US 10', 'US 11'],
        stock: 40
    },
    {
        id: 6,
        name: "Sumsung Glaxy Active 2",
        price: 6500,
        costPrice: 5500,
        category: 'Fashion',
        rating: 4.6,
        image: 'https://ae04.alicdn.com/kf/Hfd3c38456e654a5c8a4bec2e6742c1afL.jpg',
        available: true,
        description:
            'Sumsung Galaxy Active 2, 1st copy on large Discount (Best Fitness Band in Pakistan)',
        specs: [
            'Fitness Tracker',
            'Android Watch',
            'Best ',
            
        ],
        reviews: [
            {
                user: 'Maham',
                rating: 4.6,
                comment: 'Best Fitness Band Ever'
            },
            {
                user: 'Hadia.',
                rating: 4.5,
                comment: 'Perfect fit and great quality'
            }
        ],
        colors: ['Blue', 'Black', 'Light Blue'],
        sizes: ['28x30', '30x30', '32x30', '34x30', '36x30'],
        stock: 60
    },
    // Beauty & Personal Care
    {
        id: 7,
        name: 'Sauvage Dior',
        price: 2999,
        costPrice: 1999,
        category: 'Beauty',
        rating: 4.6,
        image: 'https://perfumegallery.ae/cdn/shop/files/Untitleddesign-2024-08-10T105210.629.png?v=1723272747',
        available: true,
        description: 'A luxurious and bold fragrance for men.',
        specs: ['100ml Eau de Parfum', 'Woody & Fresh', 'Long-lasting'],
        reviews: [
            { user: 'Ali', rating: 4.6, comment: 'Excellent scent!' }
        ],
        colors: ['N/A'],
        stock: 100
    },
    // Toys & Games
    {
        id: 8,
        name: 'Electric Shock Game',
        price: 1999,
        costPrice: 1499,
        category: 'Toys',
        rating: 4.8,
        image: 'https://tjcuk.sirv.com/Products/77/4/7744340/Toy-Size-17x5x13-cm-Orange-Green_7744340.jpg?w=420&q=60',
        available: true,
        description: 'Electric Shock creative Game.',
        specs: ['Best for kids', 'Creative play', 'Ages 6+'],
        reviews: [
            { user: 'Sara', rating: 4.9, comment: 'Kids love it!' },
              {
                user: 'Maria',
                rating: 4.8,
                comment: 'Best for Kids Education'
            }
             
        ],
        colors: ['Multi'],
        stock: 30
    },
    // Home & Kitchen
    {
        id: 9,
        name: '3d World Clock',
        price: 2199,
        costPrice: 1699,
        category: 'Home',
        rating: 4.7,
        image: 'https://i.ebayimg.com/images/g/1gsAAOSwP0ZdkcD0/s-l1200.jpg',
        available: true,
        description: '3d World Map Clock.',
        specs: ['Complete 3d World Map', ],
        reviews: [
            { user: 'Adeel', rating: 4.7, comment: 'Best Home decor Product' }
        ],
        colors: ['Black'],
        stock: 50
    },
    // Sports & Outdoor
    {
            
        id: 10,
        name: 'Watch with P9',
        price: 3999,
        costPrice: 3399,
        category: 'Electronics',
        rating: 4.9,
        image: 'https://shopelloo.com/wp-content/uploads/2024/10/5_8.webp',
        available: true,
        description: 'Experience high Quality Sound with Watch',
        specs: ['Graphite frame', '27 inches', 'Cover included'],
        reviews: [
            { user: 'Bilal', rating: 5.0, comment: 'Perfect balance and grip.' }
        ],
        colors: ['Blue'],
        stock: 20
    
    }
  
       

];

const categories = ['All', 'Electronics', 'Fashion', 'Beauty', 'Toys', 'Home', 'Sports'];

const promotions = [
    {
        id: 1,
        title: 'Summer Sale',
        discount: '20% OFF',
        code: 'SUMMER20',
        validUntil: '2025-02-01'
    },
    {
        id: 2,
        title: 'New User Special',
        discount: 'PKR 100 OFF',
        code: 'NEWUSER',
        validUntil: '2025-03-01'
    },
    {
        id: 3,
        title: 'Fashion Week',
        discount: '30% OFF',
        code: 'FASHION30',
        validUntil: '2025-01-31'
    }
];

// Notification data
const notifications = [
    {
        id: 1,
        type: 'order',
        title: 'Order Delivered',
        message: 'Your order #1234 has been delivered successfully',
        timestamp: new Date(2025, 0, 14, 8, 30).getTime(),
        isRead: false,
        icon: 'fa-box-check',
        color: 'green'
    },
    {
        id: 2,
        type: 'promo',
        title: 'Special Offer',
        message: 'Get 50% off on all winter collection items!',
        timestamp: new Date(2025, 0, 14, 7, 15).getTime(),
        isRead: false,
        icon: 'fa-tag',
        color: 'orange'
    },
    {
        id: 3,
        type: 'news',
        title: 'New Collection Arrived',
        message: 'Check out our latest spring collection',
        timestamp: new Date(2025, 0, 13, 18, 45).getTime(),
        isRead: true,
        icon: 'fa-tshirt',
        color: 'blue'
    },
    {
        id: 4,
        type: 'system',
        title: 'Profile Updated',
        message: 'Your profile information has been updated successfully',
        timestamp: new Date(2025, 0, 13, 15, 20).getTime(),
        isRead: true,
        icon: 'fa-user-check',
        color: 'purple'
    }
];

// Trending tags data
const trendingTags = [
    { id: 1, name: 'Summer Collection', searches: 15420 },
    { id: 2, name: 'Casual Wear', searches: 12350 },
    { id: 3, name: 'Sport Shoes', searches: 11200 },
    { id: 4, name: 'Designer Bags', searches: 9870 },
    { id: 5, name: 'Smart Watches', searches: 8940 },
    { id: 6, name: 'Formal Wear', searches: 7650 },
    { id: 7, name: 'Accessories', searches: 6780 },
    { id: 8, name: 'Winter Wear', searches: 5430 },
    { id: 9, name: 'Ethnic Wear', searches: 4980 },
    { id: 10, name: 'Sunglasses', searches: 4320 },
    { id: 11, name: 'Sneakers', searches: 3890 },
    { id: 12, name: 'Denim', searches: 3450 },
    { id: 13, name: 'Party Wear', searches: 3210 },
    { id: 14, name: 'Fitness Gear', searches: 2980 },
    { id: 15, name: 'Home Decor', searches: 2760 }
];

localStorage.setItem('products', JSON.stringify(products));

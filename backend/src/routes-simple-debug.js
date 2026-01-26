// Simple debug route without imports
router.post("/simple-debug", async (req, res) => {
  console.log("=== SIMPLE DEBUG ===");
  console.log("Received body:", req.body);
  
  try {
    const { message } = req.body;
    
    // Simple rule test without importing the service
    const rules = [
      { keywords: ['hello', 'hi'], response: "Hello! How can I help you?" },
      { keywords: ['stock', 'inventory'], response: "Check the Inventory section for stock levels." },
      { keywords: ['order', 'purchase'], response: "Go to Purchase Orders to create orders." }
    ];
    
    let response = "I'm not sure how to help with that.";
    const messageLower = message.toLowerCase();
    
    for (const rule of rules) {
      if (rule.keywords.some(keyword => messageLower.includes(keyword))) {
        response = rule.response;
        break;
      }
    }
    
    res.json({
      success: true,
      message: message,
      response: response,
      debug: "simple rule test"
    });
    
  } catch (error) {
    console.error("Simple debug error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      debug: "simple rule test failed"
    });
  }
});

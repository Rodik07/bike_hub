import express from 'express';
import { body, validationResult } from 'express-validator';
import Bike from '../models/Bike.model.js';

const router = express.Router();

// Rule-based chatbot responses
const chatbotRules = [
  {
    keywords: ['price', 'cost', 'expensive', 'cheap', 'affordable'],
    responses: [
      'You can find the price of each bike on its detail page. We also have an EMI calculator to help you plan your purchase.',
      'Prices vary by model and brand. Check the bike details page for ex-showroom prices and use our on-road price calculator for the final cost.'
    ]
  },
  {
    keywords: ['test ride', 'test', 'ride', 'booking'],
    responses: [
      'You can book a test ride by visiting the bike detail page and clicking "Book Test Ride". Select your preferred date, time, and dealer location.',
      'Test rides are available at authorized dealers. Simply select a bike, choose a dealer, and book your preferred slot.'
    ]
  },
  {
    keywords: ['dealer', 'showroom', 'location', 'where', 'near'],
    responses: [
      'You can find dealers and service centers on our map. Use the dealer locator to find the nearest one to you.',
      'Check our dealer locator map to find authorized dealers and service centers in your area.'
    ]
  },
  {
    keywords: ['compare', 'comparison', 'difference', 'vs'],
    responses: [
      'You can compare multiple bikes side by side. Select bikes you want to compare and view their specifications together.',
      'Use our bike comparison tool to see differences between models. Add bikes to comparison from the bike listing page.'
    ]
  },
  {
    keywords: ['specification', 'specs', 'features', 'details'],
    responses: [
      'Each bike has detailed specifications including engine, dimensions, performance, brakes, and suspension. Check the bike detail page for complete information.',
      'You can find comprehensive specifications for each bike including engine details, performance metrics, and technical features.'
    ]
  },
  {
    keywords: ['emi', 'loan', 'finance', 'installment'],
    responses: [
      'Use our EMI calculator to estimate your monthly installments. Enter the bike price, down payment, interest rate, and loan tenure.',
      'We have an EMI calculator tool that helps you calculate monthly installments based on your loan amount and tenure.'
    ]
  },
  {
    keywords: ['service', 'maintenance', 'repair', 'spare parts'],
    responses: [
      'You can find service centers on our map. Dealers also provide information about spare parts availability and pricing.',
      'Service centers are marked on our map. Contact them directly for service bookings and spare parts inquiries.'
    ]
  },
  {
    keywords: ['360', 'view', 'virtual', 'tour'],
    responses: [
      'Many bikes have a 360° view feature. Click on the 360° view button on the bike detail page to explore the bike virtually.',
      'You can view bikes in 360° on their detail pages. This gives you a complete view of the bike from all angles.'
    ]
  },
  {
    keywords: ['hello', 'hi', 'hey', 'greetings'],
    responses: [
      'Hello! How can I help you with your bike search today?',
      'Hi there! I can help you with bike information, bookings, dealers, and more. What would you like to know?'
    ]
  },
  {
    keywords: ['help', 'support', 'assistance'],
    responses: [
      'I can help you with bike information, test ride bookings, dealer locations, EMI calculations, and bike comparisons. What do you need?',
      'I\'m here to help! I can assist with finding bikes, booking test rides, locating dealers, and answering questions about our services.'
    ]
  }
];

// Extract bike name from message
const extractBikeName = (message) => {
  const lowerMessage = message.toLowerCase();
  // Common bike patterns
  const bikePatterns = [
    /(?:what|tell|show|about|specs?|specification|details?|info|information|price|cost|mileage|engine|power|torque|speed|weight|dimension|brake|suspension|color|feature|compare|vs|versus|better|best|difference|between)\s+(?:me|about|the|a|an)?\s*([a-z0-9\s]+?)(?:\s+(?:bike|motorcycle|scooter|model))?/i,
    /([a-z0-9\s]+?)(?:\s+(?:bike|motorcycle|scooter|model))(?:\s+(?:specs?|specification|details?|info|information|price|cost|mileage|engine|power|torque|speed|weight|dimension|brake|suspension|color|feature))?/i
  ];

  for (const pattern of bikePatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
};

// Extract two bike names for comparison
const extractBikeNames = (message) => {
  const lowerMessage = message.toLowerCase();
  const comparisonPatterns = [
    /(?:compare|vs|versus|difference|between|better|best|which)\s+(?:me|the|a|an)?\s*([a-z0-9\s]+?)\s+(?:and|vs|versus|or)\s+([a-z0-9\s]+?)(?:\s+(?:bike|motorcycle|scooter))?/i,
    /([a-z0-9\s]+?)\s+(?:vs|versus|or)\s+([a-z0-9\s]+?)(?:\s+(?:bike|motorcycle|scooter))?(?:\s+(?:which|better|best|difference))?/i
  ];

  for (const pattern of comparisonPatterns) {
    const match = message.match(pattern);
    if (match && match[1] && match[2]) {
      return [match[1].trim(), match[2].trim()];
    }
  }

  return null;
};

// Format bike specifications
const formatBikeSpecs = (bike) => {
  if (!bike) return 'Bike not found.';

  let response = `Here are the specifications for ${bike.name}:\n\n`;

  if (bike.specifications?.engine) {
    response += `**Engine:**\n`;
    if (bike.specifications.engine.displacement) response += `- Displacement: ${bike.specifications.engine.displacement}\n`;
    if (bike.specifications.engine.maxPower) response += `- Max Power: ${bike.specifications.engine.maxPower}\n`;
    if (bike.specifications.engine.maxTorque) response += `- Max Torque: ${bike.specifications.engine.maxTorque}\n`;
    if (bike.specifications.engine.cooling) response += `- Cooling: ${bike.specifications.engine.cooling}\n`;
    if (bike.specifications.engine.transmission) response += `- Transmission: ${bike.specifications.engine.transmission}\n`;
    response += '\n';
  }

  if (bike.specifications?.performance) {
    response += `**Performance:**\n`;
    if (bike.specifications.performance.mileage) response += `- Mileage: ${bike.specifications.performance.mileage}\n`;
    if (bike.specifications.performance.topSpeed) response += `- Top Speed: ${bike.specifications.performance.topSpeed}\n`;
    if (bike.specifications.performance.fuelCapacity) response += `- Fuel Capacity: ${bike.specifications.performance.fuelCapacity}\n`;
    response += '\n';
  }

  if (bike.specifications?.dimensions) {
    response += `**Dimensions:**\n`;
    if (bike.specifications.dimensions.kerbWeight) response += `- Weight: ${bike.specifications.dimensions.kerbWeight}\n`;
    if (bike.specifications.dimensions.seatHeight) response += `- Seat Height: ${bike.specifications.dimensions.seatHeight}\n`;
    if (bike.specifications.dimensions.groundClearance) response += `- Ground Clearance: ${bike.specifications.dimensions.groundClearance}\n`;
    response += '\n';
  }

  if (bike.price) {
    response += `**Price:** ₹${bike.price.toLocaleString()}\n`;
  }

  return response;
};

// Compare two bikes
const compareBikes = (bike1, bike2) => {
  if (!bike1 || !bike2) return 'One or both bikes not found.';

  let response = `**Comparison: ${bike1.name} vs ${bike2.name}**\n\n`;

  // Price comparison
  if (bike1.price && bike2.price) {
    const priceDiff = bike1.price - bike2.price;
    if (priceDiff > 0) {
      response += `💰 **Price:** ${bike2.name} is ₹${priceDiff.toLocaleString()} cheaper than ${bike1.name}.\n`;
    } else if (priceDiff < 0) {
      response += `💰 **Price:** ${bike1.name} is ₹${Math.abs(priceDiff).toLocaleString()} cheaper than ${bike2.name}.\n`;
    } else {
      response += `💰 **Price:** Both bikes have the same price (₹${bike1.price.toLocaleString()}).\n`;
    }
  }

  // Mileage comparison
  const mileage1 = bike1.specifications?.performance?.mileage;
  const mileage2 = bike2.specifications?.performance?.mileage;
  if (mileage1 && mileage2) {
    const m1 = parseFloat(mileage1);
    const m2 = parseFloat(mileage2);
    if (!isNaN(m1) && !isNaN(m2)) {
      if (m1 > m2) {
        response += `⛽ **Mileage:** ${bike1.name} has better mileage (${mileage1} vs ${mileage2}).\n`;
      } else if (m2 > m1) {
        response += `⛽ **Mileage:** ${bike2.name} has better mileage (${mileage2} vs ${mileage1}).\n`;
      } else {
        response += `⛽ **Mileage:** Both have similar mileage (${mileage1}).\n`;
      }
    }
  }

  // Power comparison
  const power1 = bike1.specifications?.engine?.maxPower;
  const power2 = bike2.specifications?.engine?.maxPower;
  if (power1 && power2) {
    const p1 = parseFloat(power1);
    const p2 = parseFloat(power2);
    if (!isNaN(p1) && !isNaN(p2)) {
      if (p1 > p2) {
        response += `⚡ **Power:** ${bike1.name} has more power (${power1} vs ${power2}).\n`;
      } else if (p2 > p1) {
        response += `⚡ **Power:** ${bike2.name} has more power (${power2} vs ${power1}).\n`;
      }
    }
  }

  // Weight comparison
  const weight1 = bike1.specifications?.dimensions?.kerbWeight;
  const weight2 = bike2.specifications?.dimensions?.kerbWeight;
  if (weight1 && weight2) {
    const w1 = parseFloat(weight1);
    const w2 = parseFloat(weight2);
    if (!isNaN(w1) && !isNaN(w2)) {
      if (w1 < w2) {
        response += `⚖️ **Weight:** ${bike1.name} is lighter (${weight1} vs ${weight2}).\n`;
      } else if (w2 < w1) {
        response += `⚖️ **Weight:** ${bike2.name} is lighter (${weight2} vs ${weight1}).\n`;
      }
    }
  }

  // ABS comparison
  const abs1 = bike1.specifications?.brakes?.abs;
  const abs2 = bike2.specifications?.brakes?.abs;
  if (abs1 !== undefined && abs2 !== undefined) {
    if (abs1 && !abs2) {
      response += `🛡️ **Safety:** ${bike1.name} has ABS, ${bike2.name} doesn't.\n`;
    } else if (abs2 && !abs1) {
      response += `🛡️ **Safety:** ${bike2.name} has ABS, ${bike1.name} doesn't.\n`;
    } else if (abs1 && abs2) {
      response += `🛡️ **Safety:** Both bikes have ABS.\n`;
    }
  }

  response += `\n💡 **Recommendation:** `;
  if (mileage1 && mileage2) {
    const m1 = parseFloat(mileage1);
    const m2 = parseFloat(mileage2);
    if (!isNaN(m1) && !isNaN(m2)) {
      if (m1 > m2 && bike1.price < bike2.price) {
        response += `${bike1.name} offers better value with higher mileage and lower price.`;
      } else if (m2 > m1 && bike2.price < bike1.price) {
        response += `${bike2.name} offers better value with higher mileage and lower price.`;
      } else if (m1 > m2) {
        response += `If fuel efficiency is your priority, ${bike1.name} is better.`;
      } else if (m2 > m1) {
        response += `If fuel efficiency is your priority, ${bike2.name} is better.`;
      } else {
        response += `Both bikes are similar. Choose based on your brand preference and budget.`;
      }
    } else {
      response += `Consider your priorities: budget, fuel efficiency, power, and features.`;
    }
  } else {
    response += `Consider your priorities: budget, fuel efficiency, power, and features.`;
  }

  return response;
};

// Simple keyword matching function with database queries
const findResponse = async (message) => {
  const lowerMessage = message.toLowerCase();

  // Check for bike comparison queries
  const bikeNames = extractBikeNames(message);
  if (bikeNames) {
    try {
      const [bike1, bike2] = await Promise.all([
        Bike.findOne({
          $or: [
            { name: { $regex: bikeNames[0], $options: 'i' } },
            { brand: { $regex: bikeNames[0], $options: 'i' } }
          ]
        }),
        Bike.findOne({
          $or: [
            { name: { $regex: bikeNames[1], $options: 'i' } },
            { brand: { $regex: bikeNames[1], $options: 'i' } }
          ]
        })
      ]);

      if (bike1 && bike2) {
        return compareBikes(bike1, bike2);
      } else if (bike1 || bike2) {
        return `I found one bike but couldn't find the other. Please check the bike names and try again.`;
      } else {
        return `I couldn't find those bikes. Please check the bike names and try again. You can search for bikes on our bikes page.`;
      }
    } catch (error) {
      console.error('Error comparing bikes:', error);
    }
  }

  // Check for bike specification queries
  const bikeName = extractBikeName(message);
  if (bikeName && (lowerMessage.includes('spec') || lowerMessage.includes('specification') ||
    lowerMessage.includes('detail') || lowerMessage.includes('info') ||
    lowerMessage.includes('mileage') || lowerMessage.includes('power') ||
    lowerMessage.includes('engine') || lowerMessage.includes('price') ||
    lowerMessage.includes('weight') || lowerMessage.includes('speed') ||
    lowerMessage.includes('brake') || lowerMessage.includes('suspension'))) {
    try {
      const bike = await Bike.findOne({
        $or: [
          { name: { $regex: bikeName, $options: 'i' } },
          { brand: { $regex: bikeName, $options: 'i' } }
        ]
      });

      if (bike) {
        return formatBikeSpecs(bike);
      } else {
        // Try to find similar bikes
        const similarBikes = await Bike.find({
          $or: [
            { name: { $regex: bikeName.split(' ')[0], $options: 'i' } },
            { brand: { $regex: bikeName.split(' ')[0], $options: 'i' } }
          ]
        }).limit(3).select('name brand');

        if (similarBikes.length > 0) {
          return `I couldn't find "${bikeName}". Did you mean: ${similarBikes.map(b => b.name).join(', ')}?`;
        }
        return `I couldn't find "${bikeName}". Please check the bike name and try again. You can browse all bikes on our bikes page.`;
      }
    } catch (error) {
      console.error('Error fetching bike:', error);
    }
  }

  // Check for conditional questions
  if (lowerMessage.includes('better') || lowerMessage.includes('best') || lowerMessage.includes('recommend')) {
    if (lowerMessage.includes('mileage') || lowerMessage.includes('fuel')) {
      try {
        const bikes = await Bike.find({
          'specifications.performance.mileage': { $exists: true, $ne: '' }
        }).limit(5).sort({ 'specifications.performance.mileage': -1 });

        if (bikes.length > 0) {
          return `For best mileage, I recommend: ${bikes.map(b => `${b.name} (${b.specifications?.performance?.mileage || 'N/A'})`).join(', ')}. Check their detail pages for complete specifications.`;
        }
      } catch (error) {
        console.error('Error fetching bikes by mileage:', error);
      }
    }

    if (lowerMessage.includes('price') || lowerMessage.includes('cheap') || lowerMessage.includes('affordable')) {
      try {
        const bikes = await Bike.find({ price: { $exists: true } }).limit(5).sort({ price: 1 });
        if (bikes.length > 0) {
          return `Most affordable bikes: ${bikes.map(b => `${b.name} (₹${b.price.toLocaleString()})`).join(', ')}. Check their detail pages for more information.`;
        }
      } catch (error) {
        console.error('Error fetching bikes by price:', error);
      }
    }

    if (lowerMessage.includes('power') || lowerMessage.includes('speed') || lowerMessage.includes('performance')) {
      try {
        const bikes = await Bike.find({
          'specifications.engine.maxPower': { $exists: true, $ne: '' }
        }).limit(5);

        if (bikes.length > 0) {
          return `For high performance, check out: ${bikes.map(b => `${b.name} (${b.specifications?.engine?.maxPower || 'N/A'})`).join(', ')}. Visit their detail pages for complete specifications.`;
        }
      } catch (error) {
        console.error('Error fetching bikes by power:', error);
      }
    }
  }

  // Standard keyword matching
  for (const rule of chatbotRules) {
    const hasKeyword = rule.keywords.some(keyword =>
      lowerMessage.includes(keyword.toLowerCase())
    );

    if (hasKeyword) {
      return rule.responses[Math.floor(Math.random() * rule.responses.length)];
    }
  }

  // Default response if no keywords match
  return 'I can help you with bike information, test ride bookings, dealer locations, and more. Could you please rephrase your question? You can ask about bike specifications, compare bikes, or get recommendations.';
};

// @route   POST /api/chatbot
// @desc    Get chatbot response
// @access  Public
router.post('/', [
  body('message').trim().escape().notEmpty().withMessage('Message is required').isLength({ max: 500 }).withMessage('Message must be less than 500 characters')
], async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Message is required' });
    }

    const response = await findResponse(message);

    res.json({ response });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/chatbot/suggestions
// @desc    Get suggested questions
// @access  Public
router.get('/suggestions', (req, res) => {
  const suggestions = [
    'How do I book a test ride?',
    'Where can I find dealers near me?',
    'What is the price of this bike?',
    'Compare KTM vs Honda bikes',
    'Which bike has the best mileage?',
    'Show me specs of Yamaha R15',
    'What is the difference between two bikes?',
    'Recommend affordable bikes',
    'How do I calculate EMI?',
    'Where are service centers located?'
  ];

  res.json({ suggestions });
});

export default router;


export const demoTemplates = [
  {
    id: 'demo-1',
    name: 'Demo 1: Color Psychology in Design',
    description: 'How color influences behavior and decision-making',
    nodes: [
      {
        id: 'demo1-root',
        type: 'promptNode',
        position: { x: 400, y: 50 },
        style: { width: 280, height: 200 },
        data: {
          id: 'demo1-root',
          title: 'Project Premise',
          content: 'Explore how color psychology influences human behavior and decision-making in digital product design, and provide actionable guidelines for designers.',
          weight: 10,
          isRoot: true,
          isSkipped: false
        }
      },
      {
        id: 'demo1-node-1',
        type: 'promptNode',
        position: { x: 100, y: 320 },
        style: { width: 220, height: 160 },
        data: {
          id: 'demo1-node-1',
          title: 'Historical Context',
          content: "Color theory has roots in Isaac Newton's 1666 experiments with prisms, but modern color psychology emerged in the early 20th century. Wassily Kandinsky's work linked colors to emotions, while Faber Birren's research in the 1930s-1960s established scientific foundations for how colors affect mood, productivity, and purchasing decisions. Today, this research forms the basis of strategic color choices in branding and UX design.",
          weight: 5,
          isRoot: false,
          isSkipped: false
        }
      },
      {
        id: 'demo1-node-2',
        type: 'promptNode',
        position: { x: 360, y: 320 },
        style: { width: 220, height: 160 },
        data: {
          id: 'demo1-node-2',
          title: 'Red - Urgency and Passion',
          content: 'Red stimulates physiological responses: increased heart rate, heightened alertness, and a sense of urgency. In design, red is used for CTAs (call-to-action buttons), clearance sales, and error messages. Studies show red CTA buttons can increase conversions by 21% compared to green. However, overuse creates anxiety and fatigue. Best practices: use red sparingly for primary actions and time-sensitive offers.',
          weight: 7,
          isRoot: false,
          isSkipped: false
        }
      },
      {
        id: 'demo1-node-3',
        type: 'promptNode',
        position: { x: 620, y: 320 },
        style: { width: 220, height: 160 },
        data: {
          id: 'demo1-node-3',
          title: 'Blue - Trust and Calm',
          content: 'Blue is the most universally preferred color, associated with trust, security, and professionalism. It lowers blood pressure and heart rate, creating a calming effect. Financial institutions (PayPal, Chase, American Express) and tech companies (Facebook, Twitter, LinkedIn) heavily use blue. Research shows blue interfaces increase perceived credibility by 40%. Ideal for: banking apps, healthcare platforms, professional tools.',
          weight: 7,
          isRoot: false,
          isSkipped: false
        }
      },
      {
        id: 'demo1-node-4',
        type: 'promptNode',
        position: { x: 100, y: 540 },
        style: { width: 220, height: 160 },
        data: {
          id: 'demo1-node-4',
          title: 'Green - Growth and Harmony',
          content: "Green symbolizes nature, growth, and balance. It's easiest on the eyes and reduces strain during prolonged screen time. Environmental brands, health apps, and financial growth indicators use green strategically. Spotify and Whole Foods leverage green for eco-friendly, wellness associations. Studies indicate green encourages relaxation and decision-making. Use for: sustainability-focused brands, health tech, confirmation messages.",
          weight: 6,
          isRoot: false,
          isSkipped: false
        }
      },
      {
        id: 'demo1-node-5',
        type: 'promptNode',
        position: { x: 360, y: 540 },
        style: { width: 220, height: 160 },
        data: {
          id: 'demo1-node-5',
          title: 'Cultural Variations',
          content: 'Color meanings vary dramatically across cultures. White represents purity in Western cultures but mourning in many Asian countries. Red signals danger in the West but celebration and luck in China. Purple conveys royalty in Europe but death in Brazil. Global products must adapt: WhatsApp uses green globally, but Uber adjusts its black/white scheme for regional markets. Critical for international design: always research target culture\'s color associations.',
          weight: 8,
          isRoot: false,
          isSkipped: false
        }
      },
      {
        id: 'demo1-node-6',
        type: 'promptNode',
        position: { x: 620, y: 540 },
        style: { width: 220, height: 160 },
        data: {
          id: 'demo1-node-6',
          title: 'Accessibility Considerations',
          content: '8% of men and 0.5% of women have color vision deficiency (CVD). Designs relying solely on color fail these users. WCAG 2.1 requires 4.5:1 contrast ratio for text, 3:1 for UI elements. Solutions: use patterns/icons alongside color, test with CVD simulators, avoid red-green combinations for critical information. Accessible design isn\'t optional—it\'s inclusive and often legally required.',
          weight: 9,
          isRoot: false,
          isSkipped: false
        }
      },
      {
        id: 'demo1-node-7',
        type: 'promptNode',
        position: { x: 360, y: 760 },
        style: { width: 220, height: 160 },
        data: {
          id: 'demo1-node-7',
          title: 'Practical Implementation',
          content: 'Effective color strategies: 1) Choose a dominant brand color (60% of design), 2) Select complementary secondary color (30%), 3) Use accent colors sparingly (10%) for CTAs, 4) Maintain consistent color system across platforms, 5) Test with real users across devices and lighting conditions, 6) Document color decisions in design systems. Tools: Coolors, Adobe Color, Contrast Checker.',
          weight: 6,
          isRoot: false,
          isSkipped: false
        }
      }
    ],
    edges: [
      { id: 'e-root-1', source: 'demo1-root', target: 'demo1-node-1', type: 'smoothstep' },
      { id: 'e-1-2', source: 'demo1-node-1', target: 'demo1-node-2', type: 'smoothstep' },
      { id: 'e-2-3', source: 'demo1-node-2', target: 'demo1-node-3', type: 'smoothstep' },
      { id: 'e-3-4', source: 'demo1-node-3', target: 'demo1-node-4', type: 'smoothstep' },
      { id: 'e-4-5', source: 'demo1-node-4', target: 'demo1-node-5', type: 'smoothstep' },
      { id: 'e-5-6', source: 'demo1-node-5', target: 'demo1-node-6', type: 'smoothstep' },
      { id: 'e-6-7', source: 'demo1-node-6', target: 'demo1-node-7', type: 'smoothstep' }
    ]
  },
  {
    id: 'demo-2',
    name: 'Demo 2: The Future of Urban Farming',
    description: 'Vertical farming reshaping food production',
    nodes: [
      {
        id: 'demo2-root',
        type: 'promptNode',
        position: { x: 400, y: 50 },
        style: { width: 280, height: 200 },
        data: {
          id: 'demo2-root',
          title: 'Project Premise',
          content: 'Examine how vertical farming and urban agriculture are reshaping food production in cities, addressing sustainability challenges while creating new economic opportunities.',
          weight: 10,
          isRoot: true,
          isSkipped: false
        }
      },
      {
        id: 'demo2-node-1',
        type: 'promptNode',
        position: { x: 100, y: 320 },
        style: { width: 220, height: 160 },
        data: {
          id: 'demo2-node-1',
          title: 'The Urban Food Crisis',
          content: 'By 2050, 68% of the global population will live in cities, creating unprecedented food security challenges. Urban areas currently import 90% of their food, traveling an average of 1,500 miles from farm to table. This creates massive carbon footprints, food waste (30% spoils during transport), and vulnerability to supply chain disruptions—as COVID-19 demonstrated. Cities need localized food production to build resilience and reduce environmental impact.',
          weight: 8,
          isRoot: false,
          isSkipped: false
        }
      },
      {
        id: 'demo2-node-2',
        type: 'promptNode',
        position: { x: 360, y: 320 },
        style: { width: 220, height: 160 },
        data: {
          id: 'demo2-node-2',
          title: 'Vertical Farming Technology',
          content: 'Vertical farms grow crops in stacked layers using LED lights, hydroponics, and climate control. AeroFarms in Newark produces 2 million pounds of greens annually in a 69,000 sq ft facility—equivalent to 390 acres of traditional farmland. These farms use 95% less water, zero pesticides, and grow year-round regardless of weather. Crops grow 3x faster than conventional farming. Technology costs are dropping: LED efficiency improved 400% since 2010.',
          weight: 7,
          isRoot: false,
          isSkipped: false
        }
      },
      {
        id: 'demo2-node-3',
        type: 'promptNode',
        position: { x: 620, y: 320 },
        style: { width: 220, height: 160 },
        data: {
          id: 'demo2-node-3',
          title: 'Economic Viability',
          content: 'Initial capital costs remain high ($10-30M for commercial operations), but operational costs are declining. Energy represents 25-30% of expenses; renewable energy integration improves margins. Plenty Unlimited raised $400M in 2021, signaling investor confidence. Urban farms create local jobs: one vertical farm employs 40-100 workers. Premium positioning (organic, ultra-fresh) allows 20-30% higher prices. Break-even timeline: 5-7 years for most operations.',
          weight: 6,
          isRoot: false,
          isSkipped: false
        }
      },
      {
        id: 'demo2-node-4',
        type: 'promptNode',
        position: { x: 230, y: 540 },
        style: { width: 220, height: 160 },
        data: {
          id: 'demo2-node-4',
          title: 'Environmental Impact',
          content: 'Vertical farms eliminate agricultural runoff (leading cause of water pollution), reduce transportation emissions by 90%, and reclaim urban brownfield sites. Singapore\'s Sky Greens produces 1 ton of vegetables daily using hydraulic water-powered rotating towers—zero carbon emissions. However, energy consumption remains a concern: indoor farms use 20-50x more energy than traditional agriculture. Solution: renewable energy. Netherlands\' PlantLab runs entirely on wind power, achieving carbon neutrality.',
          weight: 9,
          isRoot: false,
          isSkipped: false
        }
      },
      {
        id: 'demo2-node-5',
        type: 'promptNode',
        position: { x: 490, y: 540 },
        style: { width: 220, height: 160 },
        data: {
          id: 'demo2-node-5',
          title: 'Community Benefits',
          content: 'Urban farms transform food deserts into food oases. Detroit\'s urban agriculture initiative created 1,400 community gardens, providing fresh produce to underserved neighborhoods. Educational programs teach students about agriculture, nutrition, and sustainability. Brooklyn Grange\'s rooftop farms host workshops, generating community engagement alongside 100,000 lbs of produce annually. Mental health benefits: community gardening reduces anxiety and depression by 30% according to recent studies.',
          weight: 7,
          isRoot: false,
          isSkipped: false
        }
      },
      {
        id: 'demo2-node-6',
        type: 'promptNode',
        position: { x: 360, y: 760 },
        style: { width: 220, height: 160 },
        data: {
          id: 'demo2-node-6',
          title: 'Challenges and Future',
          content: 'Obstacles remain: high startup costs, limited crop variety (mostly leafy greens and herbs—grain and root vegetables still impractical), and energy demands. Future innovations: AI-driven climate optimization, CRISPR-enhanced crops for indoor growth, and integration with aquaponics (fish farming). Singapore aims for 30% food self-sufficiency by 2030 through urban farming. Success requires policy support: tax incentives, zoning reforms, and renewable energy subsidies.',
          weight: 6,
          isRoot: false,
          isSkipped: false
        }
      }
    ],
    edges: [
      { id: 'e-root-1', source: 'demo2-root', target: 'demo2-node-1', type: 'smoothstep' },
      { id: 'e-1-2', source: 'demo2-node-1', target: 'demo2-node-2', type: 'smoothstep' },
      { id: 'e-2-3', source: 'demo2-node-2', target: 'demo2-node-3', type: 'smoothstep' },
      { id: 'e-3-4', source: 'demo2-node-3', target: 'demo2-node-4', type: 'smoothstep' },
      { id: 'e-4-5', source: 'demo2-node-4', target: 'demo2-node-5', type: 'smoothstep' },
      { id: 'e-5-6', source: 'demo2-node-5', target: 'demo2-node-6', type: 'smoothstep' }
    ]
  }
];

export function loadDemoTemplate(templateId, updateNode, setNodeAsRoot, deleteNode) {
  const template = demoTemplates.find(t => t.id === templateId);
  if (!template) return null;

  // Add callbacks to nodes
  const nodesWithCallbacks = template.nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      onChange: updateNode,
      onSetAsRoot: setNodeAsRoot,
      onDelete: deleteNode,
      isSelectedForMerge: false
    }
  }));

  return {
    name: template.name,
    nodes: nodesWithCallbacks,
    edges: template.edges,
    outputContent: '',
    outputHistory: [],
    rootNodeId: template.nodes.find(n => n.data.isRoot)?.id || null
  };
}
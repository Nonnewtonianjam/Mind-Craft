// In-memory storage for nodes (shared between web app and side panel)
let currentNodes = [];

export async function GET(request) {
  try {
    return Response.json({ 
      success: true, 
      nodes: currentNodes 
    });
  } catch (error) {
    console.error('GET /api/nodes error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { nodes } = await request.json();
    
    if (!Array.isArray(nodes)) {
      return Response.json({ 
        success: false, 
        error: 'Invalid nodes array' 
      }, { status: 400 });
    }
    
    // Update the current nodes
    currentNodes = nodes;
    
    return Response.json({ 
      success: true, 
      count: currentNodes.length 
    });
  } catch (error) {
    console.error('POST /api/nodes error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get('id');
    
    if (!nodeId) {
      return Response.json({ 
        success: false, 
        error: 'Node ID required' 
      }, { status: 400 });
    }
    
    // Remove the node from current nodes
    const originalLength = currentNodes.length;
    currentNodes = currentNodes.filter(n => n.id !== nodeId);
    
    const deleted = originalLength !== currentNodes.length;
    
    return Response.json({ 
      success: true, 
      deleted,
      nodeId 
    });
  } catch (error) {
    console.error('DELETE /api/nodes error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
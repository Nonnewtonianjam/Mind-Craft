// In-memory storage for captures
let previewCaptures = [];
let directCaptures = [];
let deletedCaptureIds = new Set(); // Changed to Set for better performance

// Helper function to generate AI title using Summarizer API
async function generateAITitle(content, type) {
  // Only generate AI titles for text content
  if (type !== 'text' && type !== 'custom' && type !== 'summary') {
    return null;
  }
  
  if (!content || content.length < 20) {
    return null;
  }
  
  // Note: Summarizer API is a browser API, not available in Node.js
  // The title generation needs to happen in the browser (sidepanel.js or Flow.js)
  // For now, return null and let the client handle it
  return null;
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    console.log('Capture API received data:', data);
    
    // Generate AI title if applicable
    let aiTitle = null;
    if (data.content && (data.type === 'text' || data.type === 'custom' || data.type === 'summary')) {
      try {
        aiTitle = await generateAITitle(data.content, data.type);
        console.log('AI title generated:', aiTitle);
      } catch (error) {
        console.error('AI title generation failed:', error);
      }
    }
    
    const item = {
      ...data,
      id: data.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: data.timestamp || new Date().toISOString(),
      // Use AI title if generated, otherwise use provided title
      title: aiTitle || data.title,
      aiGenerated: !!aiTitle
    };
    
    console.log('Created item:', item);
    
    // Determine if this is a direct capture (from context menu or side panel action)
    // or a preview capture (needs user confirmation)
    const isDirect = !data.source || data.source === 'context-menu';
    
    if (isDirect) {
      directCaptures.push(item);
      // Keep only last 50 direct captures
      if (directCaptures.length > 50) {
        directCaptures = directCaptures.slice(-50);
      }
      console.log('Added to direct captures, total:', directCaptures.length);
    } else {
      previewCaptures.push(item);
      // Keep only last 20 preview captures
      if (previewCaptures.length > 20) {
        previewCaptures = previewCaptures.slice(-20);
      }
      console.log('Added to preview captures, total:', previewCaptures.length);
    }
    
    return Response.json({ 
      success: true, 
      item,
      type: isDirect ? 'direct' : 'preview'
    });
  } catch (error) {
    console.error('POST /api/capture error:', error);
    return Response.json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'preview';
    
    if (type === 'deleted') {
      // Convert Set to Array for JSON serialization
      const deletedIdsArray = Array.from(deletedCaptureIds);
      return Response.json({ 
        success: true, 
        deletedIds: deletedIdsArray
      });
    }
    
    const items = type === 'direct' ? directCaptures : previewCaptures;
    
    return Response.json({ 
      success: true, 
      items,
      type 
    });
  } catch (error) {
    console.error('GET /api/capture error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type') || 'preview';
    const fromSidePanel = searchParams.get('fromSidePanel') === 'true';
    
    if (!id) {
      // Clear all captures of the specified type
      if (type === 'direct') {
        directCaptures = [];
      } else if (type === 'deleted') {
        deletedCaptureIds.clear();
      } else {
        previewCaptures = [];
      }
      
      return Response.json({ 
        success: true, 
        cleared: type 
      });
    }
    
    // Delete specific capture
    const captures = type === 'direct' ? directCaptures : previewCaptures;
    const originalLength = captures.length;
    
    if (type === 'direct') {
      directCaptures = directCaptures.filter(item => item.id !== id);
    } else {
      previewCaptures = previewCaptures.filter(item => item.id !== id);
    }
    
    const deleted = originalLength !== captures.length;
    
    // Track deletion if it came from side panel
    if (fromSidePanel) {
      console.log('Tracking deletion from side panel:', id);
      deletedCaptureIds.add(id);
      // Keep only last 100 deleted IDs
      if (deletedCaptureIds.size > 100) {
        const idsArray = Array.from(deletedCaptureIds);
        deletedCaptureIds = new Set(idsArray.slice(-100));
      }
    }
    
    return Response.json({ 
      success: true, 
      deleted,
      id,
      trackedForDeletion: fromSidePanel
    });
  } catch (error) {
    console.error('DELETE /api/capture error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
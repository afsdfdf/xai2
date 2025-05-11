import { NextResponse } from 'next/server';

const AVE_API_KEY = process.env.AVE_API_KEY;

/**
 * Debug helper for the tokens API
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic') || 'hot';
    
    console.log(`Debug API called for topic: ${topic}`);
    
    let endpoint = '';
    if (topic === 'topics') {
      endpoint = 'https://prod.ave-api.com/v2/ranks/topics';
    } else {
      endpoint = `https://prod.ave-api.com/v2/ranks?topic=${topic}`;
    }
    
    console.log(`Fetching from external API: ${endpoint}`);
    
    // 构建请求头
    const headers: HeadersInit = {
      "Accept": "*/*"
    };
    
    if (AVE_API_KEY) {
      headers["X-API-KEY"] = AVE_API_KEY;
      console.log("Using API key from environment");
    } else {
      console.log("WARNING: No API key set");
    }
    
    const response = await fetch(endpoint, {
      headers,
      cache: 'no-store',
    });
    
    if (!response.ok) {
      console.error(`External API returned status: ${response.status}`);
      return NextResponse.json({ 
        error: `External API returned status: ${response.status}`,
        success: false,
        timestamp: Date.now()
      }, { status: response.status });
    }
    
    const data = await response.json();
    
    console.log("Raw API response:", JSON.stringify(data).substring(0, 200) + "...");
    
    // Return the debug info with the raw response
    return NextResponse.json({ 
      debug: {
        topic,
        endpoint,
        has_api_key: !!AVE_API_KEY,
        response_status: response.status,
        data_status: data?.status,
        has_data: !!data?.data,
        data_type: data?.data ? Array.isArray(data.data) ? "array" : typeof data.data : "undefined",
        data_length: data?.data && Array.isArray(data.data) ? data.data.length : "n/a"
      },
      raw_response: data,
      success: true,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error),
      success: false,
      timestamp: Date.now()
    }, { status: 500 });
  }
} 
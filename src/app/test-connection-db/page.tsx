import { unstable_noStore as noStore } from 'next/cache';

// Define types for our claims data
interface Claim {
  id: number;
  name: string;
  status: string;
  claim_score: number;
  created_at?: string;
}

async function getClaims(): Promise<Claim[]> {
  noStore(); // Opt out of caching for this request
  
  try {
    // In server components, we can use absolute URL or relative URL
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/claims`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch claims');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error loading claims:', error);
    return [];
  }
}

export default async function TestConnectionDB() {
  const claims = await getClaims();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Test Connection DB</h1>
      <p className="mb-6">This page displays claims from the database.</p>
      
      {claims.length === 0 ? (
        <p className="text-gray-500">No claims found in the database.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Claim Score</th>
                <th className="px-4 py-2 text-left">Created At</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim) => (
                <tr key={claim.id} className="border-t">
                  <td className="px-4 py-2">{claim.id}</td>
                  <td className="px-4 py-2">{claim.name}</td>
                  <td className="px-4 py-2">
                    <span 
                      className={`px-2 py-1 rounded-full text-xs ${
                        claim.status === 'approved' ? 'bg-green-100 text-green-800' :
                        claim.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}
                    >
                      {claim.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">{claim.claim_score}</td>
                  <td className="px-4 py-2">
                    {claim.created_at ? new Date(claim.created_at).toLocaleString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
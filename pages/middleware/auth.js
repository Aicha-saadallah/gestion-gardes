import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function middleware(request) {
  const path = request.nextUrl.pathname;
  const protectedRoutes = ['/front/medecin', '/api/back/mod/exchange'];
  
  // Récupérer le token depuis cookies ou headers
  const token = request.cookies.get('token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');

  // Vérifier les routes protégées
  if (protectedRoutes.some(route => path.startsWith(route))) {
    if (!token) {
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          message: 'Non autorisé - Token manquant' 
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const headers = new Headers(request.headers);
      headers.set('x-user-id', decoded.id);
      headers.set('x-user-role', decoded.role);
      
      return NextResponse.next({ request: { headers } });
    } catch (err) {
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          message: 'Non autorisé - Token invalide' 
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  return NextResponse.next();
}
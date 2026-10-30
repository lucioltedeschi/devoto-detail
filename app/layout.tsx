import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'Devoto Detail — El detalle cambia todo',description:'Estética vehicular. Lavados premium, corrección de pintura, tratamientos cerámicos y PPF. Descubrí Devoto Detail.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es-AR"><body>{children}</body></html>}

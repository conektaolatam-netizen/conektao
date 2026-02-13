import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-10 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>

        <h1 className="text-3xl font-bold mb-2">Política de Privacidad de Conektao</h1>
        <p className="text-sm text-gray-400 mb-10">Última actualización: 13 de febrero de 2026</p>

        <div className="space-y-8 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold mb-2">1. Introducción</h2>
            <p>Conektao ("nosotros", "nuestro") se compromete a proteger la privacidad de sus usuarios. Esta política describe cómo recopilamos, usamos y protegemos la información personal en el marco de nuestros servicios de automatización conversacional por WhatsApp y gestión integral para restaurantes.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">2. Información que recopilamos</h2>
            <p>En el contexto de nuestros servicios, incluyendo el asistente virtual ALICIA, podemos recopilar:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Nombre y número de teléfono del usuario final.</li>
              <li>Datos relacionados con pedidos y transacciones.</li>
              <li>Contenido de las conversaciones con el asistente virtual.</li>
              <li>Información del negocio proporcionada por el restaurante cliente (menú, precios, horarios).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">3. Uso de la información</h2>
            <p>Utilizamos la información recopilada para:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Procesar pedidos y facilitar la comunicación entre clientes y restaurantes.</li>
              <li>Mejorar la calidad del servicio y la experiencia del usuario.</li>
              <li>Generar análisis de negocio para los restaurantes clientes.</li>
              <li>Soporte técnico y resolución de incidencias.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">4. Compartición de datos</h2>
            <p><strong>No vendemos información personal a terceros.</strong> Los datos pueden ser compartidos únicamente con:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Meta (WhatsApp Cloud API)</strong> – para el envío y recepción de mensajes.</li>
              <li><strong>El restaurante cliente</strong> – para el procesamiento de pedidos realizados por sus clientes.</li>
              <li><strong>Proveedores de infraestructura</strong> – para el almacenamiento seguro de datos (Supabase).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Almacenamiento y seguridad</h2>
            <p>Los datos se almacenan en servidores seguros con cifrado en tránsito y en reposo. Implementamos medidas de seguridad técnicas y organizativas para proteger la información contra acceso no autorizado, pérdida o alteración.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">6. Derechos del usuario</h2>
            <p>De conformidad con la Ley 1581 de 2012 y el Decreto 1377 de 2013 de Colombia, usted tiene derecho a:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Conocer, actualizar y rectificar sus datos personales.</li>
              <li>Solicitar prueba de la autorización otorgada.</li>
              <li>Ser informado sobre el uso de sus datos.</li>
              <li>Revocar la autorización y/o solicitar la supresión de sus datos.</li>
              <li>Presentar quejas ante la Superintendencia de Industria y Comercio.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">7. Contacto</h2>
            <p>Para ejercer sus derechos o resolver cualquier inquietud sobre el tratamiento de sus datos personales, puede contactarnos en:</p>
            <p className="mt-2 font-medium">📧 soporte@conektao.com</p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-200 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Conektao. Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
};

export default Privacy;

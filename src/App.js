import React, { useState, useEffect, useRef } from 'react';

// --- Iconos SVG para la interfaz ---
// Un ícono de burbuja de chat para el botón flotante
const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.72 3.72a1.125 1.125 0 01-1.59 0l-3.72-3.72A1.125 1.125 0 016 16.998V12.714a1.125 1.125 0 011.125-1.125h2.25l.46-1.84a.563.563 0 01.98.243l.46 1.84h2.25a1.125 1.125 0 011.125 1.125v1.516M16.5 7.5c.621 0 1.125-.504 1.125-1.125S17.121 5.25 16.5 5.25h-9A1.125 1.125 0 006.375 6.375v1.125c0 .621.504 1.125 1.125 1.125h9z" />
  </svg>
);

// Un ícono de 'X' para cerrar el chat
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Un ícono de avión de papel para el botón de enviar
const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);


// --- Componente principal de la aplicación de Chat ---
export default function App() {
  // Estado para controlar si la ventana de chat está abierta o cerrada
  const [isOpen, setIsOpen] = useState(false);
  
  // Estado para almacenar el historial de mensajes
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: '¡Hola! Soy DevBot, tu asistente de desarrollo web. ¿En qué puedo ayudarte hoy?'
    }
  ]);

  // Estado para el mensaje que el usuario está escribiendo
  const [userInput, setUserInput] = useState('');
  
  // Estado para mostrar un indicador de "escribiendo..." mientras se espera la respuesta
  const [isLoading, setIsLoading] = useState(false);

  // Referencia al contenedor de mensajes para hacer scroll automático
  const messagesEndRef = useRef(null);
  // Referencia al campo de entrada para mantener el foco
  const inputRef = useRef(null);

  // URL del Webhook de n8n. ¡DEBES REEMPLAZAR ESTA URL!
  const N8N_WEBHOOK_URL = 'https://verticedigital.app.n8n.cloud/webhook/cbff5ca3-b53c-413a-afa5-45d96a28103c';

  // Función para hacer scroll hacia el último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // useEffect para hacer scroll cada vez que se añade un mensaje nuevo
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // useEffect para mantener el foco en el campo de entrada después de cada actualización
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  // Función para manejar el envío de mensajes
  const handleSendMessage = async (e) => {
    // Previene el comportamiento por defecto del formulario (recargar la página)
    e.preventDefault();
    
    // Si el input está vacío o se está esperando una respuesta, no hace nada
    if (!userInput.trim() || isLoading) return;

    // 1. Añade el mensaje del usuario al historial
    const userMessage = { sender: 'user', text: userInput };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setUserInput(''); // Limpia el campo de input
    setIsLoading(true); // Activa el indicador de carga

    // 2. Envía el mensaje al webhook de n8n
    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Es importante enviar el mensaje en un formato que n8n pueda leer fácilmente
        body: JSON.stringify({ message: userInput, history: messages }),
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const data = await response.json();
      
      // 3. Añade la respuesta del bot (recibida de n8n) al historial
      // n8n debe devolver un JSON con una propiedad "reply", por ejemplo: { "reply": "Hola desde el bot" }
      const botMessage = { sender: 'bot', text: data.reply || "No he podido procesar tu solicitud." };
      setMessages(prevMessages => [...prevMessages, botMessage]);

    } catch (error) {
      // Si hay un error en la comunicación, muestra un mensaje de error en el chat
      console.error("Error al conectar con el webhook:", error);
      const errorMessage = { sender: 'bot', text: 'Lo siento, estoy teniendo problemas para conectarme. Por favor, inténtalo de nuevo más tarde.' };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      // 4. Desactiva el indicador de carga
      setIsLoading(false);
    }
  };

  return (
    <div className="font-sans">
      {/* Contenedor principal del widget, posicionado en la esquina inferior derecha */}
      <div className="fixed bottom-5 right-5 z-50">
        
        {/* Ventana de Chat: solo se muestra si isOpen es true */}
        {isOpen && (
          <div className="bg-white w-80 sm:w-96 h-[60vh] max-h-[700px] rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ease-in-out">
            
            {/* Cabecera del Chat */}
            <div className="bg-blue-600 text-white p-4 rounded-t-2xl flex justify-between items-center shadow-md">
              <div>
                <h3 className="text-lg font-bold">Asistente Virtual</h3>
                <p className="text-sm opacity-90">Normalmente responde en segundos</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 p-2 rounded-full transition-colors">
                <CloseIcon />
              </button>
            </div>

            {/* Área de Mensajes */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {messages.map((msg, index) => (
                <div key={index} className={`flex mb-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-2xl py-2 px-4 max-w-[80%] break-words ${msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {/* Indicador de "escribiendo..." */}
              {isLoading && (
                <div className="flex justify-start mb-3">
                  <div className="bg-gray-200 text-gray-500 rounded-2xl py-2 px-4 rounded-bl-none">
                    <div className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-0"></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></span>
                    </div>
                  </div>
                </div>
              )}
              {/* Elemento invisible para forzar el scroll */}
              <div ref={messagesEndRef} />
            </div>

            {/* Área de Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
              <div className="flex items-center bg-gray-100 rounded-full px-2">
                <input
                  ref={inputRef} // Añadimos la referencia aquí
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  className="flex-1 bg-transparent border-none focus:ring-0 p-3 text-gray-800 placeholder-gray-500"
                  disabled={isLoading}
                />
                <button type="submit" disabled={isLoading || !userInput.trim()} className="p-2 rounded-full text-blue-600 hover:bg-blue-100 disabled:text-gray-400 disabled:hover:bg-transparent transition-colors">
                  <SendIcon />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Botón Flotante para abrir/cerrar el chat */}
        <button onClick={() => setIsOpen(!isOpen)} className="bg-blue-600 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-700 transition-transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300">
          {isOpen ? <CloseIcon /> : <ChatIcon />}
        </button>
      </div>
    </div>
  );
}


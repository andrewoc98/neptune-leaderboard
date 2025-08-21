import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, arrayRemove, arrayUnion } from "firebase/firestore";
import { database } from "./firebase"; // Adjust to your Firebase config
import './modal.css'
import { Quote } from "lucide-react";

export default function QuotesModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [quotes, setQuotes] = useState([]);
  const ref = doc(database, "quotes", "hHwBYh833CPbxMBvwdZt");

  // Fetch quotes with approved: false when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchQuotes = async () => {
      try {
        const docSnap = await getDoc(ref);
        if (docSnap.exists()) {
          const allQuotes = docSnap.data().quotes || [];
          const pendingQuotes = allQuotes.filter(q => q.approved === false);
          setQuotes(pendingQuotes);
        }
      } catch (error) {
        console.error("Error fetching quotes: ", error);
      }
    };

    fetchQuotes();
  }, [isOpen]);

  const approveQuote = async (quote) => {
    try {
      await updateDoc(ref, { quotes: arrayRemove(quote) });
      await updateDoc(ref, { quotes: arrayUnion({ ...quote, approved: true }) });
      setQuotes(quotes.filter(q => q !== quote));
    } catch (error) {
      console.error("Error approving quote: ", error);
    }
  };

  const rejectQuote = async (quote) => {
    try {
      await updateDoc(ref, { quotes: arrayRemove(quote) });
      setQuotes(quotes.filter(q => q !== quote));
    } catch (error) {
      console.error("Error rejecting quote: ", error);
    }
  };

  return (
    <div>
      {/* Button to open modal */}
      <button
        onClick={() => setIsOpen(true)}
        className="btn"
      >
       <Quote/>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="modal-overlay">
          <div className="modal-content flex flex-col">
            <h2 className="modal-title">Pending Quotes</h2>

            <div className="modal-body">
              {quotes.length === 0 && <p>No pending quotes.</p>}

              <ul>
                {quotes.map((quote, index) => (
                  <li key={index} className="mb-4 p-2 border rounded border-gray-700">
                    <p style={{color:'white'}}>{quote.quote}</p>
                    <p style={{color:'white'}}>{quote.author}</p>
                    <div className="modal-footer">
                      <button
                        onClick={() => approveQuote(quote)}
                        className="modal-button submit"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectQuote(quote)}
                        className="modal-button cancel"
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setIsOpen(false)}
                className="modal-button cancel"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

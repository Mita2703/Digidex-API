import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import './App.css';

const API_BASE = 'https://digi-api.com/api/v1/digimon';

function App() {
  const [digimons, setDigimons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 20;

  // Search
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Modal
  const [selectedDigimon, setSelectedDigimon] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Fetch list or search
  useEffect(() => {
    const fetchDigimons = async () => {
      setLoading(true);
      setError(null);
      try {
        if (searchTerm.trim() !== '') {
          // Note: Digimon API search by name returns a single digimon directly if exact match,
          // or we can use the /digimon endpoint with name query, but let's try exact search first.
          // Wait, actually the best way to search in this API is /api/v1/digimon?name=xxx for partial matches,
          // but let's try fetching the specific one if it's exact, or just use the ?name query if supported.
          // Digimon API doesn't support partial name query easily, but let's fetch by exact ID or name.
          const res = await fetch(`${API_BASE}/${searchTerm.trim()}`);
          if (!res.ok) throw new Error('Digimon not found!');
          const data = await res.json();
          // Wrap in array since it returns a single object
          setDigimons([data]);
          setTotalPages(1);
          setIsSearching(true);
        } else {
          setIsSearching(false);
          const res = await fetch(`${API_BASE}?page=${currentPage}&pageSize=${pageSize}`);
          if (!res.ok) throw new Error('Failed to fetch data');
          const data = await res.json();
          setDigimons(data.content);
          setTotalPages(data.pageable.totalPages);
        }
      } catch (err) {
        if (searchTerm.trim() !== '') {
          setDigimons([]);
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const delay = setTimeout(() => {
      fetchDigimons();
    }, 500);

    return () => clearTimeout(delay);
  }, [currentPage, searchTerm]);

  const openModal = async (idOrName) => {
    setModalLoading(true);
    setSelectedDigimon(true); // show loader
    try {
      const res = await fetch(`${API_BASE}/${idOrName}`);
      if (!res.ok) throw new Error('Failed to fetch details');
      const data = await res.json();
      setSelectedDigimon(data);
    } catch (err) {
      console.error(err);
      setSelectedDigimon(null);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => setSelectedDigimon(null);

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage(p => p + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 0) setCurrentPage(p => p - 1);
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="header-title">Digidex</h1>
        <p className="header-subtitle">Jelajahi Database Dunia Digital</p>
      </header>

      <div className="search-container">
        <div className="search-box">
          <Search className="search-icon" size={20} />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Cari nama atau ID Digimon (cth: Agumon, 1)..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(0);
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="loader-container">
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-muted)' }}>Mencari di Dunia Digital...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <h3>Oops! Terjadi Kesalahan</h3>
          <p>{error}</p>
        </div>
      ) : digimons.length === 0 ? (
        <div className="empty-state">
          <p>Tidak ada Digimon yang ditemukan dengan nama "{searchTerm}"</p>
        </div>
      ) : (
        <>
          <div className="digimon-grid">
            {digimons.map((digimon) => {
              // Extract image depending on whether it's from list or single fetch
              const imgUrl = digimon.image || (digimon.images && digimon.images[0]?.href);
              
              return (
                <div 
                  key={digimon.id} 
                  className="digimon-card"
                  onClick={() => openModal(digimon.id)}
                >
                  <div className="digimon-img-container">
                    <img src={imgUrl} alt={digimon.name} className="digimon-img" loading="lazy" />
                  </div>
                  <div className="digimon-id">#{digimon.id}</div>
                  <h3 className="digimon-name">{digimon.name}</h3>
                </div>
              );
            })}
          </div>

          {!isSearching && totalPages > 1 && (
            <div className="pagination">
              <button 
                className="btn-page" 
                onClick={handlePrevPage} 
                disabled={currentPage === 0}
              >
                <ChevronLeft size={18} /> Prev
              </button>
              <span className="page-info">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button 
                className="btn-page" 
                onClick={handleNextPage} 
                disabled={currentPage >= totalPages - 1}
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal Details */}
      {selectedDigimon && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <X size={24} />
            </button>
            
            {modalLoading || selectedDigimon === true ? (
              <div className="loader-container" style={{ padding: '6rem 0' }}>
                <div className="spinner"></div>
                <p style={{ color: 'var(--text-muted)' }}>Menganalisis Data...</p>
              </div>
            ) : (
              <>
                <div className="modal-header">
                  <div className="modal-img-wrapper">
                    <img 
                      src={selectedDigimon.images?.[0]?.href || selectedDigimon.image} 
                      alt={selectedDigimon.name} 
                    />
                  </div>
                  <h2 className="modal-title">{selectedDigimon.name}</h2>
                  <div className="badge" style={{ fontSize: '1rem', marginTop: '0.5rem' }}>
                    ID: #{selectedDigimon.id}
                  </div>
                </div>
                
                <div className="modal-body">
                  <div className="info-grid">
                    <div className="info-box">
                      <div className="info-label">Level</div>
                      <div className="info-value">
                        {selectedDigimon.levels?.length > 0 
                          ? selectedDigimon.levels.map(l => <span key={l.id} className="badge">{l.level}</span>) 
                          : '-'}
                      </div>
                    </div>
                    
                    <div className="info-box">
                      <div className="info-label">Tipe</div>
                      <div className="info-value">
                        {selectedDigimon.types?.length > 0 
                          ? selectedDigimon.types.map(t => <span key={t.id} className="badge" style={{background: 'rgba(249, 115, 22, 0.15)', color: '#f97316', borderColor: 'rgba(249, 115, 22, 0.3)'}}>{t.type}</span>) 
                          : '-'}
                      </div>
                    </div>
                    
                    <div className="info-box">
                      <div className="info-label">Atribut</div>
                      <div className="info-value">
                        {selectedDigimon.attributes?.length > 0 
                          ? selectedDigimon.attributes.map(a => <span key={a.id} className="badge" style={{background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)'}}>{a.attribute}</span>) 
                          : '-'}
                      </div>
                    </div>
                  </div>

                  {selectedDigimon.descriptions && selectedDigimon.descriptions.length > 0 && (
                    <div style={{ marginTop: '2rem' }}>
                      <div className="info-label" style={{ marginBottom: '1rem' }}>Deskripsi</div>
                      <div className="modal-desc">
                        {/* Find english description or fallback to first */}
                        {selectedDigimon.descriptions.find(d => d.language === 'en_us')?.description || 
                         selectedDigimon.descriptions[0].description}
                      </div>
                    </div>
                  )}

                  {selectedDigimon.skills && selectedDigimon.skills.length > 0 && (
                    <div style={{ marginTop: '2.5rem' }}>
                      <div className="info-label" style={{ marginBottom: '1rem' }}>Kemampuan / Skill</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {selectedDigimon.skills.map(skill => (
                          <div key={skill.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <div style={{ fontWeight: '600', color: 'var(--primary)', marginBottom: '0.25rem' }}>{skill.skill}</div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{skill.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

import React, { useState } from 'react';

const defaultShoppingList = [
  { category: 'Proteins', items: [
    { name: 'Chicken breast', base: 1.2, unit: 'kg' },
    { name: 'Turkey breast', base: 0.5, unit: 'kg' },
    { name: 'Lean beef/sirloin', base: 0.6, unit: 'kg' },
    { name: 'Large eggs', base: 18, unit: 'count' },
    { name: 'Liquid egg whites', base: 1, unit: 'liter' },
    { name: 'Whey isolate protein', base: 1, unit: 'container' },
  ]},
  { category: 'Carbohydrates', items: [
    { name: 'Rolled oats', base: 1, unit: 'kg' },
    { name: 'Brown rice (dry)', base: 1, unit: 'kg' },
    { name: 'Basmati rice (dry)', base: 0.5, unit: 'kg' },
    { name: 'Sweet potatoes', base: 1, unit: 'kg' },
    { name: 'Whole grain/oat bread', base: 1, unit: 'loaf' },
  ]},
  { category: 'Vegetables', items: [
    { name: 'Fresh spinach', base: 2, unit: 'large bags' },
    { name: 'Fresh broccoli', base: 1, unit: 'kg' },
    { name: 'Button mushrooms', base: 0.5, unit: 'kg' },
    { name: 'Bell peppers (mixed colors)', base: 6, unit: 'pieces' },
    { name: 'Mixed salad greens', base: 2, unit: 'large bags' },
    { name: 'Cucumbers', base: 3, unit: 'large' },
    { name: 'Cherry tomatoes', base: 1, unit: 'container' },
  ]},
  { category: 'Healthy Fats', items: [
    { name: 'Avocados', base: 4, unit: 'medium' },
    { name: 'Extra virgin olive oil', base: 0.5, unit: 'liter' },
    { name: 'Natural almond butter', base: 1, unit: 'jar' },
    { name: 'Raw walnuts', base: 0.2, unit: 'kg' },
  ]},
  { category: 'Fruits & Berries', items: [
    { name: 'Mixed berries (fresh/frozen)', base: 0.5, unit: 'kg' },
    { name: 'Blueberries', base: 0.3, unit: 'kg' },
    { name: 'Raspberries', base: 0.2, unit: 'kg' },
    { name: 'Fresh lemons', base: 4, unit: 'pieces' },
  ]},
  { category: 'Seasonings & Extras', items: [
    { name: 'Himalayan pink salt', base: 1, unit: 'container' },
    { name: 'Fresh ground black pepper', base: 1, unit: 'container' },
    { name: 'Ground cinnamon', base: 1, unit: 'container' },
    { name: 'Fresh garlic', base: 1, unit: 'bulb' },
    { name: 'Fresh herbs (parsley, basil)', base: 2, unit: 'packs' },
    { name: 'Green tea bags', base: 1, unit: 'box' },
    { name: 'Black coffee', base: 1, unit: 'your preferred brand' },
  ]},
];

const peopleOptions = [1, 2, 3, 4, 5];
const weekOptions = [1, 2, 3, 4];
const proteinOptions = [
  { value: 'mixed', label: 'Mixed proteins' },
  { value: 'chicken', label: 'Chicken only' },
  { value: 'vegetarian', label: 'Vegetarian' },
];

const ShoppingList = () => {
  const [people, setPeople] = useState(1);
  const [weeks, setWeeks] = useState(1);
  const [protein, setProtein] = useState('mixed');
  const [customList, setCustomList] = useState(null);

  const handleGenerate = () => {
    // Simple scaling: multiply base by people and weeks
    let list = JSON.parse(JSON.stringify(defaultShoppingList));
    if (protein !== 'mixed') {
      // Filter protein sources if not mixed
      list = list.map(cat => {
        if (cat.category === 'Proteins') {
          let items = cat.items;
          if (protein === 'chicken') {
            items = items.filter(i => i.name.toLowerCase().includes('chicken'));
          } else if (protein === 'vegetarian') {
            items = items.filter(i => i.name.toLowerCase().includes('egg') || i.name.toLowerCase().includes('whey'));
          }
          return { ...cat, items };
        }
        return cat;
      });
    }
    list = list.map(cat => ({
      ...cat,
      items: cat.items.map(i => ({
        ...i,
        amount: Math.round(i.base * people * weeks * 100) / 100
      }))
    }));
    setCustomList(list);
  };

  return (
    <section className="card" style={{ marginBottom: 'var(--spacing-xl)', padding: 'var(--spacing-md)'}}>
      <h2>Weekly Shopping List</h2>
      <p style={{ marginBottom: 32, color: '#717171', fontSize: '1.125rem' }}>
        <strong>Plan ahead:</strong> Shop weekly for fresh ingredients | 
        <strong>Prep tip:</strong> Buy proteins in bulk and freeze portions
      </p>
      <div className="shopping-week">
        <div className="day-title">🛒 Weekly Shopping List - Standard Week</div>
        <p style={{ marginBottom: 24, color: '#717171' }}>This covers Monday, Tuesday, Thursday, Friday meals + one weekend day</p>
        <div className="shopping-list-grid">
          <div className="shopping-category">
            <h3>🥩 Proteins</h3>
            <ul>
              <li>Chicken breast: 1.2kg (150g × 4 days + 200g × 2 days)</li>
              <li>Turkey breast: 500g (250g × 2 days)</li>
              <li>Lean beef/sirloin: 600g (120g × 5 days)</li>
              <li>Large eggs: 18 count (2 whole × 6 days)</li>
              <li>Liquid egg whites: 1 liter (4 whites × 6 days)</li>
              <li>Whey isolate protein: 1 container (3 scoops daily)</li>
            </ul>
          </div>
          <div className="shopping-category">
            <h3>🌾 Carbohydrates</h3>
            <ul>
              <li>Rolled oats: 1kg bag (50g × 6 days)</li>
              <li>Brown rice (dry): 1kg bag (35g × 6 days)</li>
              <li>Basmati rice (dry): 500g (backup option)</li>
              <li>Sweet potatoes: 1kg (60g × 4 days)</li>
              <li>Whole grain/oat bread: 1 loaf (1 slice × 6 days)</li>
            </ul>
          </div>
          <div className="shopping-category">
            <h3>🥬 Vegetables</h3>
            <ul>
              <li>Fresh spinach: 2 large bags (100g × 6 days)</li>
              <li>Fresh broccoli: 1kg (100g × 6 days)</li>
              <li>Button mushrooms: 500g (80g × 6 days)</li>
              <li>Bell peppers (mixed colors): 6 pieces (80g × 6 days)</li>
              <li>Mixed salad greens: 2 large bags (150g × 4 days)</li>
              <li>Cucumbers: 3 large (for salads)</li>
              <li>Cherry tomatoes: 1 container (for salads)</li>
            </ul>
          </div>
          <div className="shopping-category">
            <h3>🥑 Healthy Fats</h3>
            <ul>
              <li>Avocados: 4 medium (25g × 6 days)</li>
              <li>Extra virgin olive oil: 500ml bottle</li>
              <li>Natural almond butter: 1 jar (8g × 6 days)</li>
              <li>Raw walnuts: 200g bag (for Tuesday/Friday)</li>
            </ul>
          </div>
          <div className="shopping-category">
            <h3>🫐 Fruits & Berries</h3>
            <ul>
              <li>Mixed berries (fresh/frozen): 500g (80g × 6 days)</li>
              <li>Blueberries: 300g container</li>
              <li>Raspberries: 200g container</li>
              <li>Fresh lemons: 4 pieces (for dressing)</li>
            </ul>
          </div>
          <div className="shopping-category">
            <h3>🧂 Seasonings & Extras</h3>
            <ul>
              <li>Himalayan pink salt: 1 container</li>
              <li>Fresh ground black pepper: 1 container</li>
              <li>Ground cinnamon: 1 container</li>
              <li>Fresh garlic: 1 bulb</li>
              <li>Fresh herbs (parsley, basil): 2 packs</li>
              <li>Green tea bags: 1 box</li>
              <li>Black coffee: your preferred brand</li>
            </ul>
          </div>
        </div>
        <div className="shopping-summary">
          <h4>💰 Estimated Weekly Cost: $80-120 (varies by location)</h4>
          <p><strong>Money-saving tips:</strong></p>
          <ul>
            <li>Buy proteins in bulk and freeze in daily portions</li>
            <li>Choose frozen berries when fresh is expensive</li>
            <li>Buy oats and rice in larger quantities</li>
            <li>Shop sales for seasonal vegetables</li>
            <li>Consider generic brands for basic ingredients</li>
          </ul>
        </div>
      </div>
      <div className="shopping-week">
        <div className="day-title">📦 Bulk Prep Shopping (Monthly)</div>
        <p style={{ marginBottom: 24, color: '#717171' }}>Stock up on these items monthly to save time and money</p>
        <div className="shopping-list-grid">
          <div className="shopping-category">
            <h3>🥫 Pantry Staples</h3>
            <ul>
              <li>Rolled oats: 5kg bag (lasts ~6 weeks)</li>
              <li>Brown rice: 5kg bag (lasts ~8 weeks)</li>
              <li>Whey isolate: 2kg container (lasts ~4 weeks)</li>
              <li>Olive oil: 1L bottle (lasts ~2 months)</li>
              <li>Almond butter: Large jar (lasts ~3 weeks)</li>
            </ul>
          </div>
          <div className="shopping-category">
            <h3>🧊 Freezer Stock</h3>
            <ul>
              <li>Chicken breast: 3kg family pack (freeze in 150g portions)</li>
              <li>Lean ground beef: 2kg (freeze in 120g portions)</li>
              <li>Turkey breast: 1.5kg (freeze in 200g portions)</li>
              <li>Frozen mixed berries: 2kg bag (lasts ~1 month)</li>
              <li>Frozen broccoli: 1kg bag (backup option)</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="shopping-week">
        <div className="day-title">📝 Smart Shopping Tips</div>
        <div className="shopping-list-grid">
          <div className="shopping-category">
            <h3>🕐 Shopping Schedule</h3>
            <div className="meal">
              <div className="meal-content">
                <strong>Sunday morning:</strong> Main weekly shop<br />
                <strong>Wednesday evening:</strong> Fresh vegetables restock<br />
                <strong>Saturday:</strong> Weekend meal prep ingredients<br /><br />
                <strong>Best times to shop:</strong><br />
                • Early morning (7-9 AM) for freshest produce<br />
                • Late evening (8-9 PM) for markdowns<br />
                • Weekdays to avoid crowds
              </div>
            </div>
          </div>
          <div className="shopping-category">
            <h3>💡 Meal Prep Strategy</h3>
            <div className="meal">
              <div className="meal-content">
                <strong>Sunday prep (2-3 hours):</strong><br />
                • Cook all rice for the week<br />
                • Grill/bake all chicken and beef<br />
                • Wash and cut all vegetables<br />
                • Portion proteins into containers<br />
                • Hard boil eggs for quick meals<br /><br />
                <strong>Wednesday mini-prep (30 min):</strong><br />
                • Restock fresh vegetables<br />
                • Prepare overnight oats<br />
                • Check protein portions
              </div>
            </div>
          </div>
          <div className="shopping-category">
            <h3>🏪 Store Strategy</h3>
            <div className="meal">
              <div className="meal-content">
                <strong>Primary store (80% of shopping):</strong><br />
                • Large supermarket for bulk items<br />
                • Best prices on proteins and staples<br /><br />
                <strong>Specialty stores (20%):</strong><br />
                • Butcher for fresh, quality meats<br />
                • Farmer's market for fresh vegetables<br />
                • Health food store for specialty proteins<br /><br />
                <strong>Online options:</strong><br />
                • Bulk dry goods (oats, rice)<br />
                • Protein powder subscriptions<br />
                • Non-perishable pantry items
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="shopping-week">
        <div className="day-title">📱 Shopping List Generator</div>
        <div style={{ background: '#f7f7f7', padding: 24, borderRadius: 12, border: '1px solid #e6e6e6' }}>
          <h4 style={{ marginBottom: 20, color: '#222' }}>Generate Custom Shopping List</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div className="measurement-input">
              <label>Number of people:</label>
              <select value={people} onChange={e => setPeople(Number(e.target.value))}>
                {peopleOptions.map(opt => <option key={opt} value={opt}>{opt} {opt === 1 ? 'person' : 'people'}</option>)}
              </select>
            </div>
            <div className="measurement-input">
              <label>Weeks to shop for:</label>
              <select value={weeks} onChange={e => setWeeks(Number(e.target.value))}>
                {weekOptions.map(opt => <option key={opt} value={opt}>{opt} {opt === 1 ? 'week' : 'weeks'}</option>)}
              </select>
            </div>
            <div className="measurement-input">
              <label>Protein preference:</label>
              <select value={protein} onChange={e => setProtein(e.target.value)}>
                {proteinOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>
          <button className="save-btn" onClick={handleGenerate} style={{ opacity: 1, cursor: 'pointer' }}>🛒 Generate Custom List</button>
          <div id="custom-shopping-list" style={{ marginTop: 24 }}>
            {customList && (
              <div className="custom-list-result">
                {customList.map(cat => (
                  <div key={cat.category} style={{ marginBottom: 18 }}>
                    <h4 style={{ color: '#0c4a6e', fontSize: '1.08rem', marginBottom: 8 }}>{cat.category}</h4>
                    <ul style={{ marginLeft: 18 }}>
                      {cat.items.map(i => (
                        <li key={i.name}>
                          {i.name}: <strong>{i.amount}</strong> {i.unit}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <style jsx>{`
        .shopping-week {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: #f7f7f7;
          border-radius: 16px;
          border: 1px solid #e6e6e6;
        }
        .day-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #222;
          margin-bottom: 1rem;
        }
        .shopping-list-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 1.5rem;
        }
        .shopping-category {
          background: #fff;
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid #e6e6e6;
        }
        .shopping-category h3 {
          color: #222;
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 1.25rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #e6e6e6;
        }
        .shopping-summary {
          margin-top: 2rem;
          padding: 1.5rem;
          background: #f0f9ff;
          border-radius: 12px;
          border: 1px solid #bae6fd;
        }
        .shopping-summary h4 {
          color: #0c4a6e;
          margin-bottom: 0.75rem;
          font-size: 1.125rem;
          font-weight: 600;
        }
        .shopping-summary p {
          color: #0369a1;
          margin-bottom: 0.75rem;
          font-weight: 500;
        }
        .shopping-summary ul {
          color: #0369a1;
          margin-left: 20px;
          line-height: 1.6;
        }
        .measurement-input label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #222;
          margin-bottom: 8px;
        }
        .save-btn {
          background: #ff385c;
          color: white;
          padding: 14px 24px;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: not-allowed;
          margin-top: 16px;
          opacity: 0.6;
        }
      `}</style>
    </section>
  );
};

export default ShoppingList; 
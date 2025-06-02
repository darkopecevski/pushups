import React from 'react';

const MealPlan = () => (
  <section className="card" style={{ marginBottom: 'var(--spacing-xl)', padding: 'var(--spacing-md)' }}>
    <h2>Daily Meal Plan</h2>
    <p style={{ marginBottom: 32, color: '#717171', fontSize: '1.125rem' }}>
      <strong>Eating Window:</strong> 12:00 PM - 8:00 PM (16h fast) | 
      <strong>Daily Target:</strong> 2,100 calories | 190g protein | 123g carbs | 45g fat
    </p>
    <div className="meal-plan">
      <div className="meal-day">
        <div className="day-title">📅 Monday & Thursday</div>
        <div className="meal">
          <div className="meal-title">🌅 Pre-Workout (7:15 AM)</div>
          <div className="meal-content">
            • Black coffee or green tea<br />
            • Optional: 10g BCAA if low energy
          </div>
        </div>
        <div className="meal">
          <div className="meal-title">💪 Post-Workout (8:30 AM)</div>
          <div className="meal-content">
            • Whey isolate protein: 30g<br />
            • Water: 500ml
          </div>
          <div className="macros">30g protein | 1g carbs | 0g fat | 124 calories</div>
        </div>
        <div className="meal">
          <div className="meal-title">🍳 Meal 1 - Eggs Breakfast (12:00 PM)</div>
          <div className="meal-content">
            • Whole eggs: 2 large<br />
            • Egg whites: 4 large<br />
            • Fresh spinach: 100g<br />
            • Mushrooms: 80g<br />
            • Olive oil (cooking): 5ml<br />
            • Oat bread: 1 slice (25g)
          </div>
          <div className="macros">34g protein | 19g carbs | 16g fat | 362 calories</div>
        </div>
        <div className="meal">
          <div className="meal-title">🥣 Meal 2 - Oats & Protein (3:00 PM)</div>
          <div className="meal-content">
            • Rolled oats (dry): 50g<br />
            • Whey isolate powder: 30g<br />
            • Mixed berries: 80g<br />
            • Almond butter: 8g<br />
            • Cinnamon: 1g
          </div>
          <div className="macros">33g protein | 46g carbs | 8g fat | 378 calories</div>
        </div>
        <div className="meal">
          <div className="meal-title">🍗 Meal 3 - Main Protein (5:30 PM)</div>
          <div className="meal-content">
            • Chicken breast: 150g<br />
            • Brown rice (dry): 35g<br />
            • Broccoli: 100g<br />
            • Bell pepper: 80g<br />
            • Olive oil: 5ml
          </div>
          <div className="macros">53g protein | 35g carbs | 9g fat | 430 calories</div>
        </div>
        <div className="meal">
          <div className="meal-title">🥗 Meal 4 - Light Dinner (7:30 PM)</div>
          <div className="meal-content">
            • Lean beef OR turkey breast: 120g<br />
            • Sweet potato: 60g<br />
            • Mixed green salad: 150g<br />
            • Avocado: 25g<br />
            • Lemon juice and herbs
          </div>
          <div className="macros">40g protein | 22g carbs | 12g fat | 346 calories</div>
        </div>
      </div>
      <div className="meal-day">
        <div className="day-title">🚫 Wednesday - 24h Fast Day</div>
        <div className="meal">
          <div className="meal-content" style={{ textAlign: 'center', padding: 32 }}>
            <strong>Tuesday 8:00 PM:</strong> Last meal<br />
            <strong>Wednesday all day:</strong> Water, black coffee, green tea, herbal teas ONLY<br />
            <strong>Thursday 12:00 PM:</strong> Break fast with Meal 1
          </div>
        </div>
      </div>
      <div className="meal-day">
        <div className="day-title">🔄 Tuesday & Friday Variations</div>
        <div className="meal">
          <div className="meal-content">
            <strong>Meal 1:</strong> Make omelet instead of scrambled eggs<br />
            <strong>Meal 2:</strong> Add 10g chopped walnuts, reduce almond butter to 5g<br />
            <strong>Meal 3:</strong> Replace chicken with turkey breast (150g)<br />
            <strong>Meal 4:</strong> Replace beef with chicken breast (120g)
          </div>
        </div>
      </div>
      <div className="meal-day">
        <div className="day-title">🌟 Weekend Variations</div>
        <div className="meal">
          <div className="meal-content">
            <strong>Meal 1:</strong> Boiled eggs with spinach salad<br />
            <strong>Meal 2:</strong> Prepare as overnight oats with berries<br />
            <strong>Meal 3:</strong> Grill protein with roasted vegetables<br />
            <strong>Meal 4:</strong> Lighter portion - just salad with protein
          </div>
        </div>
      </div>
    </div>
    <style jsx>{`
      .meal-plan {
        margin-top: 2rem;
      }
      .meal-day {
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
      .meal {
        margin-bottom: 1.25rem;
        padding: 1.25rem;
        background: #fff;
        border-radius: 12px;
        border: 1px solid #e6e6e6;
      }
      .meal-title {
        font-weight: 600;
        color: #222;
        margin-bottom: 0.75rem;
        font-size: 1rem;
      }
      .meal-content {
        font-size: 0.95rem;
        line-height: 1.6;
        color: #484848;
      }
      .macros {
        margin-top: 0.75rem;
        padding: 0.75rem 1rem;
        background: #f7f7f7;
        border-radius: 8px;
        font-size: 0.85rem;
        color: #717171;
        font-weight: 500;
      }
    `}</style>
  </section>
);

export default MealPlan; 
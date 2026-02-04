// Firebase Initialization Script
// Run this once to seed the initial data into Firestore

import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { db } from './firebase';

// Badge definitions for the GreenScore system
export const BADGES = [
  // Plastic & Packaging (5)
  { id: 'plastic-free-champ', name: 'Plastic-Free Champ', description: 'No plastic bags used', category: 'plastic_packaging', icon: '🚫' },
  { id: 'low-plastic-usage', name: 'Low-Plastic Usage', description: 'Reduced plastic with paper alternatives', category: 'plastic_packaging', icon: '📦' },
  { id: 'eco-packaging-pro', name: 'Eco Packaging Pro', description: 'Biodegradable/recyclable packaging', category: 'plastic_packaging', icon: '♻️' },
  { id: 'byob-friendly', name: 'Bring-Your-Own Friendly', description: 'Allows customer containers', category: 'plastic_packaging', icon: '🛍️' },
  { id: 'zero-packaging', name: 'Zero Packaging', description: 'Bulk/refill-style shop', category: 'plastic_packaging', icon: '🌿' },
  
  // Energy & Resources (5)
  { id: 'energy-saver', name: 'Energy Saver', description: 'LED lights, efficient appliances', category: 'energy_resources', icon: '💡' },
  { id: 'green-power', name: 'Green Power User', description: 'Solar/renewable energy usage', category: 'energy_resources', icon: '☀️' },
  { id: 'low-energy-waste', name: 'Low Energy Waste', description: 'No unnecessary lights, optimized usage', category: 'energy_resources', icon: '⚡' },
  { id: 'smart-cooling', name: 'Smart Cooling', description: 'Efficient AC/natural ventilation', category: 'energy_resources', icon: '❄️' },
  { id: 'water-saver', name: 'Water Saver', description: 'Tap control, no visible water waste', category: 'energy_resources', icon: '💧' },
  
  // Operations & Systems (5)
  { id: 'digital-billing', name: 'Digital Billing Hero', description: 'Digital receipts and invoices', category: 'operations_systems', icon: '📱' },
  { id: 'paper-reduction', name: 'Paper Reduction Champ', description: 'Minimal paper receipts/menus/flyers', category: 'operations_systems', icon: '📄' },
  { id: 'waste-segregation', name: 'Waste Segregation Pro', description: 'Separate dry/wet waste bins visible', category: 'operations_systems', icon: '🗑️' },
  { id: 'clean-disposal', name: 'Clean Disposal Partner', description: 'Proper garbage handling', category: 'operations_systems', icon: '🚛' },
  { id: 'compliance-friendly', name: 'Compliance Friendly', description: 'Follows local eco guidelines', category: 'operations_systems', icon: '✅' },
  
  // Community & Consistency (5)
  { id: 'community-trusted', name: 'Community Trusted', description: 'High user credibility confirmations', category: 'community_consistency', icon: '🤝' },
  { id: 'eco-improvement', name: 'Eco Improvement Star', description: 'Score improved over time', category: 'community_consistency', icon: '📈' },
  { id: 'consistency-king', name: 'Consistency King', description: 'High % maintained for 60+ days', category: 'community_consistency', icon: '👑' },
  { id: 'green-favorite', name: 'Green Favorite', description: 'Frequently chosen by eco-conscious users', category: 'community_consistency', icon: '💚' },
  { id: 'green-earth-certified', name: 'Green Earth Certified', description: 'Top-tier certification (85+ score, trusted)', category: 'community_consistency', icon: '🏆' },
];

// Owner whitelist
export const OWNER_WHITELIST = [
  { email: 'test@owner.com', status: 'pending', addedBy: null, activatedAt: null },
];

// Seed badges
export async function seedBadges() {
  console.log('Seeding badges...');
  
  for (const badge of BADGES) {
    await setDoc(doc(db, 'badges', badge.id), badge);
  }
  
  console.log('Badges seeded successfully!');
}

// Seed owner whitelist
export async function seedOwnerWhitelist() {
  console.log('Seeding owner whitelist...');
  
  for (const entry of OWNER_WHITELIST) {
    await setDoc(doc(db, 'ownerWhitelist', entry.email), {
      ...entry,
      createdAt: new Date(),
    });
  }
  
  console.log('Owner whitelist seeded successfully!');
}

// Check if badges exist
export async function checkBadgesExist(): Promise<boolean> {
  const snapshot = await getDocs(collection(db, 'badges'));
  return !snapshot.empty;
}

// Initialize all seed data
export async function initializeFirestore() {
  const badgesExist = await checkBadgesExist();
  
  if (!badgesExist) {
    await seedBadges();
    await seedOwnerWhitelist();
    console.log('Firestore initialized with seed data!');
  } else {
    console.log('Firestore already has data, skipping seed.');
  }
}

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const API_URL = 'http://192.168.1.15:5000/api/auth';

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('Explore');
  // Database State (Properties & Pending Approval System)
  const [propertiesList, setPropertiesList] = useState([]);
  const [pendingProperties, setPendingProperties] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  // Favorites / Wishlist State
  const [favorites, setFavorites] = useState([]);

  // User Account, Wallet & Dealer Packages State
  const [walletBalance, setWalletBalance] = useState(500000);
  const [addAmount, setAddAmount] = useState('');
  const [userInvestments, setUserInvestments] = useState([]);
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [kycStatus, setKycStatus] = useState('Unverified');
  const [cnicImage, setCnicImage] = useState(null);

  // Dealer Package / Listing Limit State
  const [remainingAdQuota, setRemainingAdQuota] = useState(0); // Kitne ads mazeed lag sakte hain
  const [activePackageName, setActivePackageName] = useState('No Active Package');

  // Modal State
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [investAmount, setInvestAmount] = useState('');
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState('5');

  // Post Ad Form State
  const [adTitle, setAdTitle] = useState('');
  const [adDesc, setAdDesc] = useState('');
  const [adPrice, setAdPrice] = useState('');
  const [adLocation, setAdLocation] = useState('');
  const [adImage, setAdImage] = useState('');

  // Push Notification Trigger Function
  const triggerNotification = async (title, body) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        sound: true,
      },
      trigger: null,
    });
  };
const PROPERTY_API_URL = 'http://192.168.1.15:5000/api/properties';

  const handlePostProperty = async (propertyData) => {
    try {
      const response = await fetch(`${PROPERTY_API_URL}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: propertyData.title,
          price: propertyData.price,
          location: propertyData.location,
          bedrooms: propertyData.bedrooms,
          bathrooms: propertyData.bathrooms,
          description: propertyData.description,
          image: propertyData.image,
          owner: user ? user.id : null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success! 🏡', 'Your property has been posted to the database.');
        setActiveTab('Explore');
      } else {
        Alert.alert('Failed', data.error || 'Could not post property');
      }
    } catch (error) {
      Alert.alert('Network Error', 'Could not connect to the backend server.');
    }
  };
  // Chat System State
  const [messages, setMessages] = useState([
    { id: '1', sender: 'Admin', text: 'Welcome to EstateShare support! How can we help you today?' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Dealer Packages List (Jaise Zameen.com par hote hain)
  const dealerPackages = [
    { id: 'p1', name: 'Agent Starter Pack', price: 25000, adLimit: 5, duration: '30 Days' },
    { id: 'p2', name: 'Professional Dealer Gold', price: 75000, adLimit: 20, duration: '60 Days' },
    { id: 'p3', name: 'Enterprise Real Estate Platinum', price: 150000, adLimit: 50, duration: '90 Days' },
  ];

  const handleBuyPackage = (pkg) => {
    if (walletBalance < pkg.price) {
      Alert.alert('Insufficient Balance', 'Please top up your wallet first to purchase this dealer package.');
      return;
    }

    Alert.alert(
      'Confirm Package Purchase',
      `Buy ${pkg.name} for PKR ${pkg.price.toLocaleString()}? It gives you limit to post ${pkg.adLimit} ads.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Pay',
          onPress: () => {
            setWalletBalance(prev => prev - pkg.price);
            setRemainingAdQuota(prev => prev + pkg.adLimit);
            setActivePackageName(pkg.name);
            triggerNotification("Package Activated! 📦", `Successfully purchased ${pkg.name}. You can now post up to ${pkg.adLimit} ads.`);
            Alert.alert('Success! 🎉', `You have successfully subscribed to ${pkg.name}. Ad quota updated.`);
          }
        }
      ]
    );
  };

  const handlePostAd = () => {
    if (remainingAdQuota <= 0) {
      Alert.alert('Quota Expired', 'You do not have an active listing quota! Please buy a dealer package from the "Packages" tab first.');
      setActiveTab('Packages');
      return;
    }

    if (!adTitle || !adDesc || !adPrice || !adLocation || !adImage) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const newProperty = {
      _id: Date.now().toString(),
      title: adTitle,
      description: adDesc,
      price: Number(adPrice),
      location: adLocation,
      image: adImage,
      minInvest: 50000,
      expectedROI: 15,
      reviews: []
    };

    setPendingProperties(prev => [newProperty, ...prev]);
    setRemainingAdQuota(prev => prev - 1); // Ek ad ki limit deduct ho jaye gi
    triggerNotification("Ad Submitted! 🏠", "Your property ad has been submitted for admin approval.");
    Alert.alert('Submitted', `Property submitted for Admin Approval! Remaining ad quota: ${remainingAdQuota - 1}`);

    setAdTitle('');
    setAdDesc('');
    setAdPrice('');
    setAdLocation('');
    setAdImage('');
    setActiveTab('Explore');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>EstateShare 🏢</Text>
          <Text style={styles.subHeader}>Package: {activePackageName} | Quota: {remainingAdQuota} Ads left</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContainer}>
        {['Explore', 'Packages', 'Post', 'Wallet', 'Profile'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'Packages' ? '📦 Dealer Plans' : tab === 'Post' ? '+ Post Ad' : tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'Explore' && (
          <View>
            <Text style={styles.sectionTitle}>Explore Live Properties</Text>
            <Text style={{ color: '#666', marginBottom: 15 }}>Browse verified properties listed by professional dealers.</Text>
            {propertiesList.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#999', marginTop: 30 }}>No properties available yet. Check back soon!</Text>
            ) : (
              propertiesList.map(item => (
                <View key={item._id} style={styles.card}>
                  <Image source={{ uri: item.image }} style={styles.cardImage} />
                  <View style={{ padding: 12 }}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardLocation}>📍 {item.location}</Text>
                    <Text style={styles.cardPrice}>PKR {item.price?.toLocaleString()}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'Packages' && (
          <View>
            <Text style={styles.sectionTitle}>Dealer Listing Packages 📦</Text>
            <Text style={styles.subInfoText}>Purchase an ad posting package to list your properties for sale or fractional investment, just like Zameen.com dealer portal.</Text>
            
            <View style={styles.currentPkgBox}>
              <Text style={{ color: '#fff', fontSize: 13 }}>Current Active Package:</Text>
              <Text style={{ color: '#10b981', fontSize: 16, fontWeight: 'bold' }}>{activePackageName}</Text>
              <Text style={{ color: '#fff', fontSize: 13, marginTop: 4 }}>Remaining Ad Quota: {remainingAdQuota} Ads</Text>
            </View>

            {dealerPackages.map(pkg => (
              <View key={pkg.id} style={styles.pkgCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pkgTitle}>{pkg.name}</Text>
                  <Text style={styles.pkgDesc}>Includes {pkg.adLimit} property listings • Valid for {pkg.duration}</Text>
                  <Text style={styles.pkgPrice}>PKR {pkg.price.toLocaleString()}</Text>
                </View>
                <TouchableOpacity style={styles.buyPkgBtn} onPress={() => handleBuyPackage(pkg)}>
                  <Text style={styles.buyPkgBtnText}>Buy Package</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'Post' && (
          <View>
            <Text style={styles.sectionTitle}>Post New Property Ad 🏡</Text>
            <Text style={styles.subInfoText}>Available Quota: {remainingAdQuota} Ads remaining.</Text>

            <Text style={styles.label}>Property Title</Text>
            <TextInput style={styles.input} placeholder="e.g. Luxury Commercial Plaza" value={adTitle} onChangeText={setAdTitle} />

            <Text style={styles.label}>Description</Text>
            <TextInput style={[styles.input, { height: 80 }]} placeholder="Enter details..." value={adDesc} onChangeText={setAdDesc} multiline />

            <Text style={styles.label}>Total Price (PKR)</Text>
            <TextInput style={styles.input} placeholder="e.g. 25000000" keyboardType="numeric" value={adPrice} onChangeText={setAdPrice} />

            <Text style={styles.label}>Location</Text>
            <TextInput style={styles.input} placeholder="e.g. Islamabad, Pakistan" value={adLocation} onChangeText={setAdLocation} />

            <Text style={styles.label}>Image URL</Text>
            <TextInput style={styles.input} placeholder="Paste image link" value={adImage} onChangeText={setAdImage} autoCapitalize="none" />

            <TouchableOpacity style={styles.confirmButton} onPress={handlePostAd}>
              <Text style={styles.confirmButtonText}>Publish Property Listing</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'Wallet' && (
          <View>
            <View style={styles.walletBox}>
              <Text style={{ color: '#fff', fontSize: 14 }}>My Wallet Balance</Text>
              <Text style={{ color: '#10b981', fontSize: 28, fontWeight: 'bold', marginVertical: 6 }}>PKR {walletBalance.toLocaleString()}</Text>
            </View>
            <Text style={styles.label}>Top Up Wallet Amount (PKR)</Text>
            <TextInput style={styles.input} placeholder="100000" keyboardType="numeric" value={addAmount} onChangeText={setAddAmount} />
            <TouchableOpacity style={styles.confirmButton} onPress={() => {
              const amt = parseFloat(addAmount);
              if (amt > 0) {
                setWalletBalance(prev => prev + amt);
                setAddAmount('');
                Alert.alert('Success', `Added PKR ${amt.toLocaleString()} to wallet.`);
              }
            }}>
              <Text style={styles.confirmButtonText}>Add Funds</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'Profile' && (
          <View>
            <Text style={styles.sectionTitle}>Dealer Profile 👤</Text>
            <Text style={styles.label}>Dealer Name</Text>
            <TextInput style={styles.input} value={userName} onChangeText={setUserName} placeholder="Enter your name" />
            <Text style={styles.label}>Phone Number</Text>
            <TextInput style={styles.input} value={userPhone} onChangeText={setUserPhone} placeholder="+92 300..." keyboardType="phone-pad" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  subHeader: { fontSize: 11, color: '#10b981', fontWeight: '600', marginTop: 2 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#e2e8f0', padding: 4, margin: 12, borderRadius: 10 },
  tabButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginRight: 4 },
  activeTabButton: { backgroundColor: '#0f172a' },
  tabText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  activeTabText: { color: '#ffffff' },
  scrollContent: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 6 },
  subInfoText: { fontSize: 12, color: '#64748b', marginBottom: 16 },
  currentPkgBox: { backgroundColor: '#0f172a', padding: 16, borderRadius: 12, marginBottom: 16 },
  pkgCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center' },
  pkgTitle: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  pkgDesc: { fontSize: 11, color: '#64748b', marginVertical: 4 },
  pkgPrice: { fontSize: 14, fontWeight: 'bold', color: '#10b981' },
  buyPkgBtn: { backgroundColor: '#10b981', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  buyPkgBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  label: { fontSize: 12, fontWeight: '600', color: '#334155', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, marginBottom: 14, fontSize: 14 },
  confirmButton: { backgroundColor: '#10b981', padding: 14, borderRadius: 8, alignItems: 'center' },
  confirmButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  walletBox: { backgroundColor: '#0f172a', padding: 20, borderRadius: 12, marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  cardImage: { width: '100%', height: 160 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  cardLocation: { fontSize: 12, color: '#64748b', marginVertical: 2 },
  cardPrice: { fontSize: 14, fontWeight: 'bold', color: '#10b981', marginTop: 4 }
});
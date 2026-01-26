import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import JobCard from '../../components/JobCard';

const { width, height } = Dimensions.get('window');

// Custom Map Style
const mapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#bdbdbd" }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#eeeeee" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{ "color": "#e5e5e5" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "road.arterial",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#dadada" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#c9c9c9" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  }
];

const MapsScreen = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  
  const [markers] = useState([
    {
      id: 1,
      coordinate: { latitude: 18.460, longitude: 73.850 },
      price: '1000',
      title: 'Paver Block Fitting',
      category: 'Construction',
      icon: 'hammer',
      distance: '2 km',
      duration: '6 hrs',
      postedTime: '12 min ago',
      salary: '1000',
      image: require('../src/images/construction_site.png'),
    },
    {
      id: 2,
      coordinate: { latitude: 18.465, longitude: 73.855 },
      price: '900',
      title: 'Electrical Wiring Help',
      category: 'Electrical',
      icon: 'flash',
      distance: '1.2 km',
      duration: '2 hrs',
      postedTime: '35 min ago',
      salary: '900',
      image: require('../src/images/construction_site.png'),
    },
    {
      id: 3,
      coordinate: { latitude: 18.455, longitude: 73.845 },
      price: '600',
      title: 'Pipe Leakage Fix',
      category: 'Plumbing',
      icon: 'wrench',
      distance: '3.5 km',
      duration: '4 hrs',
      postedTime: '1 hr ago',
      salary: '600',
      image: require('../src/images/construction_site.png'),
    },
    {
      id: 4,
      coordinate: { latitude: 18.470, longitude: 73.860 },
      price: '850',
      title: 'Site Excavation',
      category: 'Construction',
      icon: 'shovel',
      distance: '0.8 km',
      duration: '8 hrs',
      postedTime: '45 min ago',
      salary: '850',
      image: require('../src/images/construction_site.png'),
    },
  ]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
    })();
  }, []);

  const handleAcceptJob = (jobId) => {
    console.log(`Accepted Job ID: ${jobId}`);
    setSelectedMarker(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={mapStyle}
        initialRegion={
          userLocation ? {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          } : {
            latitude: 18.462,
            longitude: 73.852,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          }
        }
      >
        {/* User Location Marker */}
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title="Your Location"
            pinColor="#007AFF"
          />
        )}

        {/* Job Markers */}
        {markers.map((marker) => (
          <Marker 
            key={marker.id} 
            coordinate={marker.coordinate}
            onPress={() => setSelectedMarker(marker)}
          >
            <View style={[
              styles.markerContainer,
              selectedMarker?.id === marker.id && styles.markerSelected
            ]}>
              <View style={styles.priceBubble}>
                <Text style={styles.priceText}>₹{marker.price}</Text>
              </View>
              <View style={[
                styles.pinCircle,
                selectedMarker?.id === marker.id && styles.pinCircleSelected
              ]}>
                <Icon name={marker.icon} size={24} color="#007AFF" />
              </View>
              <View style={styles.arrowBorder} />
              <View style={styles.arrow} />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Job Details using JobCard */}
      {selectedMarker && (
        <View style={styles.jobDetailsContainer}>
          <TouchableOpacity 
            style={styles.overlay}
            onPress={() => setSelectedMarker(null)}
          />
          <View style={styles.bottomSheet}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setSelectedMarker(null)}
            >
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
            
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <JobCard 
                job={selectedMarker} 
                onAccept={handleAcceptJob}
              />
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    width: width,
    height: height,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
  },
  markerSelected: {
    transform: [{ scale: 1.2 }],
  },
  priceBubble: {
    backgroundColor: '#FF9F43',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginBottom: 8,
    zIndex: 2,
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  pinCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    zIndex: 1,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  pinCircleSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#FF9F43',
    borderWidth: 3,
  },
  arrowBorder: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderTopColor: 'rgba(0,0,0,0.15)',
    borderWidth: 10,
    alignSelf: 'center',
    marginTop: -2,
  },
  arrow: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderTopColor: '#fff',
    borderWidth: 10,
    alignSelf: 'center',
    marginTop: -20,
  },
  jobDetailsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bottomSheet: {
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 8,
  },
  scrollContent: {
    paddingBottom: 10,
  },
});

export default MapsScreen;
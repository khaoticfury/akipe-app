"use client";

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native";
import LimaMap from "../../../src/components/LimaMap";
import { fetchAllLimaRestaurants } from "../../../src/utils/fetchRestaurants";
import { Restaurant } from "../../../src/types/restaurant";

export default function MainScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedView, setSelectedView] = useState<"map" | "list">("map");
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedRadius, setSelectedRadius] = useState<number>(3); // default radius 3 km
  const [filterVisible, setFilterVisible] = useState<boolean>(false);

  useEffect(() => {
    // Fetch all restaurants with selected radius
    const fetchRestaurants = async () => {
      try {
        const data = await fetchAllLimaRestaurants(selectedRadius);
        // Map RestaurantData to Restaurant with default values for missing fields
        const mappedData: Restaurant[] = data.map((r, index) => ({
          id: r.name + index, // generate id from name and index
          name: r.name,
          address: r.address,
          district: r.district,
          type_of_cuisine: r.type_of_cuisine || "general",
          gps_coordinates: r.gps_coordinates,
          opening_hours: "Unknown",
          contact_number: "",
          social_links: {},
          price_range: { min: 0, max: 0, currency: "S/" },
          category: r.category || "general",
          date_added: new Date().toISOString(),
          rating: 0,
          wait_time: "Unknown",
          seating_capacity: 0,
          group_friendly: { solo: true, couple: true, family: true, large_group: true },
        }));
        setRestaurants(mappedData);
      } catch (error) {
        Alert.alert("Error", "Failed to load restaurants");
      }
    };
    fetchRestaurants();
  }, [selectedRadius]);

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          Alert.alert("Error", "Failed to get user location");
        }
      );
    }
  }, []);

  // Filter restaurants within radius from user location
  const filteredRestaurants = userLocation
    ? restaurants.filter((restaurant) => {
        const toRad = (value: number) => (value * Math.PI) / 180;
        const R = 6371; // km
        const dLat = toRad(restaurant.gps_coordinates.latitude - userLocation.latitude);
        const dLon = toRad(restaurant.gps_coordinates.longitude - userLocation.longitude);
        const lat1 = toRad(userLocation.latitude);
        const lat2 = toRad(restaurant.gps_coordinates.latitude);

        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance <= selectedRadius;
      })
    : restaurants;

  const renderListItem = ({ item }: { item: Restaurant }) => (
    <View style={styles.listItem}>
      <Text style={styles.foodName}>{item.name}</Text>
      <Text>{item.address}</Text>
      <Text>District: {item.district}</Text>
      <Text>Category: {item.category}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>DESCUBRIMIENTO AKIPE</Text>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, selectedView === "map" && styles.activeButton]}
          onPress={() => setSelectedView("map")}
        >
          <Text style={selectedView === "map" ? styles.activeText : styles.inactiveText}>Map View</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, selectedView === "list" && styles.activeButton]}
          onPress={() => setSelectedView("list")}
        >
          <Text style={selectedView === "list" ? styles.activeText : styles.inactiveText}>List View</Text>
        </TouchableOpacity>
      </View>

      {selectedView === "map" ? (
        <View style={{ flex: 1 }}>
          <LimaMap
            restaurants={filteredRestaurants}
            selectedRadius={selectedRadius}
            userLocation={userLocation}
          />
          <View style={styles.floatingFilterButtonContainer}>
            <TouchableOpacity
              style={styles.floatingFilterButton}
              onPress={() => setFilterVisible(!filterVisible)}
              accessibilityLabel="Toggle Distance Filter"
            >
              <Text style={styles.floatingFilterButtonText}>Distance: {selectedRadius} km</Text>
            </TouchableOpacity>
            {filterVisible && (
              <View style={styles.filterOptions}>
                {[1, 3, 5, 10].map((radius) => (
                  <TouchableOpacity
                    key={radius}
                    style={[
                      styles.filterOptionButton,
                      selectedRadius === radius && styles.filterOptionButtonSelected,
                    ]}
                    onPress={() => {
                      setSelectedRadius(radius);
                      setFilterVisible(false);
                    }}
                  >
                    <Text
                      style={
                        selectedRadius === radius
                          ? styles.filterOptionTextSelected
                          : styles.filterOptionText
                      }
                    >
                      {radius} km
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredRestaurants}
          keyExtractor={(item) => item.id}
          renderItem={renderListItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
  },
  container: {
    flex: 1,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#000",
    marginHorizontal: 5,
  },
  activeButton: {
    backgroundColor: "#000",
  },
  activeText: {
    color: "#fff",
    fontWeight: "bold",
  },
  inactiveText: {
    color: "#000",
  },
  floatingFilterButtonContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
    alignItems: "center",
  },
  floatingFilterButton: {
    backgroundColor: "#000",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  floatingFilterButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  filterOptions: {
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  filterOptionButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: "#000",
  },
  filterOptionButtonSelected: {
    backgroundColor: "#000",
  },
  filterOptionText: {
    color: "#000",
  },
  filterOptionTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
  list: {
    paddingHorizontal: 10,
  },
  listItem: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    marginVertical: 8,
    borderRadius: 8,
    borderColor: "#ddd",
    borderWidth: 1,
  },
  foodName: {
    fontWeight: "bold",
    fontSize: 16,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Session } from '@supabase/supabase-js';

const screenWidth = Dimensions.get('window').width;

interface Article {
  id: string;
  title: string;
  summary: string;
  category: string;
  readTime: string;
  date: string;
  url: string;
  author: string;
}

interface RouteParams {
  session: Session;
}

const Articles = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { session } = route.params as RouteParams;

  const categories = [
    'All',
    'General Health',
    'Nutrition',
    'Exercise',
    'Mental Health',
    'Preventive Care',
    'Medical Breakthroughs',
    'Public Health',
  ];

  const mockArticles: Article[] = [
    {
      id: '1',
      title: "Kerala doctors treat world's first dual case of amoebic meningitis, fungal infection",
      summary:
        "Doctors in Kerala successfully treated a rare dual infection of amoebic meningitis and fungal infection in a teenager, marking a global medical milestone.",
      category: 'Medical Breakthroughs',
      readTime: '8 min read',
      date: '2025-09-12',
      author: 'Economic Times Health',
      url: 'https://health.economictimes.indiatimes.com/news/industry/kerala-achieves-medical-milestone-worlds-first-dual-treatment-of-amoebic-meningitis-and-fungal-infection/123691781?utm_source=top_story&utm_medium=latestNews',
    },
    {
      id: '2',
      title: 'Hidden viruses in our DNA could be medicine’s next big breakthrough',
      summary:
        'Researchers uncovered a viral protein in human DNA that may open new diagnostic and therapeutic options for cancer and autoimmune diseases.',
      category: 'Medical Breakthroughs',
      readTime: '6 min read',
      date: '2025-09-10',
      author: 'ScienceDaily',
      url: 'https://www.sciencedaily.com/releases/2025/09/250902085154.htm',
    },
    {
      id: '3',
      title: 'Study finds cannabis improves sleep where other drugs fail',
      summary:
        'A study shows cannabis-based products help insomnia patients improve sleep quality and reduce anxiety over 18 months.',
      category: 'Mental Health',
      readTime: '5 min read',
      date: '2025-09-02',
      author: 'ScienceDaily',
      url: 'https://www.sciencedaily.com/releases/2025/09/250901104658.htm',
    },
    {
      id: '4',
      title: 'Your nose could detect Alzheimer’s years before memory loss',
      summary:
        'Researchers found early smell loss in Alzheimer’s is due to immune cell activity destroying nerve connections, enabling earlier diagnosis.',
      category: 'General Health',
      readTime: '6 min read',
      date: '2025-09-01',
      author: 'ScienceDaily',
      url: 'https://www.sciencedaily.com/releases/2025/09/250901104643.htm',
    },
    {
      id: '5',
      title: 'Low-calorie Mediterranean diet and exercise may help lower diabetes risk',
      summary:
        'A six-year study found that combining a calorie-restricted Mediterranean diet with exercise significantly lowers type 2 diabetes risk.',
      category: 'Nutrition',
      readTime: '7 min read',
      date: '2025-08-31',
      author: 'Medical News Today',
      url: 'https://www.medicalnewstoday.com/articles/low-calorie-mediterranean-diet-and-exercise-may-help-lower-diabetes-risk',
    },
    {
      id: '6',
      title: 'How to control blood sugar in 14 days without medicine: 8 doctor-recommended tips',
      summary:
        'Doctors recommend lifestyle changes like balanced diet and exercise to improve blood sugar levels significantly within two weeks.',
      category: 'Preventive Care',
      readTime: '5 min read',
      date: '2025-08-30',
      author: 'Times of India',
      url: 'https://timesofindia.indiatimes.com/life-style/health-fitness/health-news/how-to-control-blood-sugar-in-14-days-without-medicine-8-doctor-recommended-tips/photostory/123677345.cms',
    },
    {
      id: '7',
      title: 'Management of rickets: the new horizons for the pediatrician',
      summary:
        'Modern approaches for managing rickets include early vitamin D supplementation, nutritional interventions, and improved diagnostics for genetic forms.',
      category: 'Public Health',
      readTime: '6 min read',
      date: '2025-08-29',
      author: 'BioMed Central',
      url: 'https://jhpn.biomedcentral.com/articles/10.1186/s41043-025-00885-4',
    },
    {
      id: '8',
      title: 'Plant-based traditional remedies and their role in public health: ethnomedicinal perspectives for a growing population',
      summary:
        'Traditional herbal medicines are vital in many communities but require better safety standards and scientific validation.',
      category: 'Public Health',
      readTime: '7 min read',
      date: '2025-08-28',
      author: 'BioMed Central',
      url: 'https://jhpn.biomedcentral.com/articles/10.1186/s41043-025-01036-5',
    },
    {
      id: '9',
      title: 'After narrowing Covid-19 vaccine approval, the FDA says healthy people can still get it. But access might be complicated',
      summary:
        'The FDA limited COVID-19 vaccine updates mainly to high-risk groups; healthy people can get it but might face access challenges.',
      category: 'Preventive Care',
      readTime: '6 min read',
      date: '2025-08-27',
      author: 'CNN Health',
      url: 'https://edition.cnn.com/2025/08/29/health/covid-vaccine-access-questions-healthy',
    },
    {
      id: '10',
      title: 'Sugary Drinks Increase Hair Loss Risk, but These Nutrients Can Help',
      summary:
        'High sugar intake is linked to hair loss; nutrients like protein, zinc, and omega-3s may help reduce risk.',
      category: 'Nutrition',
      readTime: '5 min read',
      date: '2025-08-26',
      author: 'Healthline',
      url: 'https://www.healthline.com/health-news/sugary-drinks-may-increase-hair-loss-risk',
    },
    {
      id: '11',
      title: 'Cannabis Use Linked to Better Sleep In People With Insomnia',
      summary:
        'Medical cannabis may improve sleep duration and reduce anxiety for people with chronic insomnia.',
      category: 'Mental Health',
      readTime: '5 min read',
      date: '2025-08-25',
      author: 'Healthline',
      url: 'https://www.healthline.com/health-news/cannabis-use-improves-insomnia-study',
    },
    {
      id: '12',
      title: "What Is ‘Ozempic Vulva’ and Is It a Real Side Effect of GLP-1 Drugs?",
      summary:
        'Some women on GLP-1 drugs report genital irritation, likely due to rapid weight loss or dehydration rather than the drug itself.',
      category: 'General Health',
      readTime: '6 min read',
      date: '2025-08-24',
      author: 'Healthline',
      url: 'https://www.healthline.com/health-news/ozempic-vulva-side-effect-glp-1-drugs',
    },
    {
      id: '13',
      title: 'Is Alkaline or Electrolyte-Infused Water Better Than Tap? What Experts Think',
      summary:
        'Experts say tap water is generally best; alkaline and electrolyte waters offer benefits only in special cases.',
      category: 'Nutrition',
      readTime: '5 min read',
      date: '2025-08-23',
      author: 'Healthline',
      url: 'https://www.healthline.com/health-news/alkaline-electrolyte-tap-best-water-hydration',
    },
  ];

  useEffect(() => {
    setArticles(mockArticles);
    setLoading(false);
  }, []);

  useEffect(() => {
    let filtered = articles;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredArticles(filtered);
  }, [searchQuery, selectedCategory, articles]);

  const handleCategoryPress = (category: string) => {
    setSelectedCategory(category);
  };

  const handleArticlePress = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Failed to open the article.');
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
      paddingTop: 10,
    },
    searchBar: {
      height: 40,
      marginHorizontal: 16,
      marginBottom: 10,
      borderRadius: 8,
      paddingHorizontal: 10,
      backgroundColor: '#f0f0f0',
      color: '#000',
    },
    categoriesContainer: {
      flexDirection: 'row',
      paddingHorizontal: 10,
      marginBottom: 10,
      flexWrap: 'wrap',
    },
    categoryButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: '#000',
      backgroundColor: '#fff',
      marginRight: 8,
    },
    categoryButtonSelected: {
      backgroundColor: '#000',
    },
    categoryButtonText: {
      fontSize: 14,
      color: '#000',
    },
    categoryButtonTextSelected: {
      color: '#fff',
      fontWeight: 'bold',
    },
    articleCard: {
      backgroundColor: '#fff',
      borderRadius: 10,
      padding: 15,
      marginHorizontal: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#000',
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    articleTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 6,
      color: '#000',
    },
    articleSummary: {
      fontSize: 14,
      marginBottom: 8,
      color: '#333',
    },
    articleMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    articleCategory: {
      fontSize: 12,
      fontWeight: '600',
      color: '#555',
      fontStyle: 'italic',
    },
    articleReadTime: {
      fontSize: 12,
      color: '#555',
    },
    articleDate: {
      fontSize: 12,
      color: '#777',
      marginBottom: 4,
    },
    articleAuthor: {
      fontSize: 12,
      fontWeight: '600',
      color: '#444',
      marginBottom: 6,
    },
    noResultsText: {
      textAlign: 'center',
      marginTop: 40,
      fontSize: 16,
      color: '#666',
    },
  });

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search articles..."
        placeholderTextColor="#888"
        style={styles.searchBar}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map((category, index) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.categoryButtonSelected,
              index === categories.length - 1 && { marginRight: 0 },
            ]}
            onPress={() => handleCategoryPress(category)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === category && styles.categoryButtonTextSelected,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 20 }} />
      ) : filteredArticles.length === 0 ? (
        <Text style={styles.noResultsText}>No articles found.</Text>
      ) : (
        <ScrollView>
          {filteredArticles.map(article => (
            <TouchableOpacity
              key={article.id}
              style={styles.articleCard}
              onPress={() => handleArticlePress(article.url)}
              activeOpacity={0.8}
            >
              <Text style={styles.articleTitle}>{article.title}</Text>
              <Text style={styles.articleSummary}>{article.summary}</Text>
              <View style={styles.articleMeta}>
                <Text style={styles.articleCategory}>{article.category}</Text>
                <Text style={styles.articleReadTime}>{article.readTime}</Text>
              </View>
              <Text style={styles.articleDate}>{article.date}</Text>
              <Text style={styles.articleAuthor}>By {article.author}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default Articles;

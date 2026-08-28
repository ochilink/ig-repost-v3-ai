import { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ScrollView, Switch } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import axios from 'axios';

const BACKEND = 'https://ig-repost-v3-ai.onrender.com';

export default function HomeScreen(){
  const [link, setLink] = useState('');
  const [handle, setHandle] = useState('');
  const [caption, setCaption] = useState('');
  const [hasPermission, setHasPermission] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('any');

  const pasteLink = async () => {
    const text = await Clipboard.getStringAsync();
    setLink(text);
    const m = text.match(/instagram\.com\/(reel|p)\/([^\/]+)/);
    if(m) setCaption(`Reposting this 🔥\nOriginal: ${text}\n\n#repost`);
  };

  const extractVideo = async () => {
    if(!link) return Alert.alert('Paste IG link first');
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND}/api/extract`, { url: link });
      setExtracted(res.data);
      if(res.data.author) setHandle(res.data.author);
      Alert.alert('Extracted!', `Found video for @${res.data.author || 'creator'} via ${res.data.method}`);
    } catch(e){
      Alert.alert('Extract failed', JSON.stringify(e.response?.data || e.message));
    }
    setLoading(false);
  };

  const repostAnything = async () => {
    if(!hasPermission) return Alert.alert('Check permission box');
    if(!extracted?.video_url) return Alert.alert('Extract video first');
    setLoading(true);
    try {
      const fileUri = FileSystem.cacheDirectory + `repost_${Date.now()}.mp4`;
      const dl = await FileSystem.downloadAsync(extracted.video_url, fileUri);
      const finalCaption = `${caption}\n\nCredit: @${handle || extracted.author || 'original'} via Repost App`;
      await Clipboard.setStringAsync(finalCaption);
      Alert.alert('Caption copied!', 'Paste in Instagram');
      if(await Sharing.isAvailableAsync()){
        await Sharing.shareAsync(dl.uri, { dialogTitle: 'Open in Instagram', UTI: 'com.apple.m4v' });
      }
    } catch(e){ Alert.alert('Error', e.message); }
    setLoading(false);
  };

  const autoPublishOwn = async () => {
    if(!extracted?.video_url) return Alert.alert('Extract first');
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND}/api/instagram/repost`, {
        video_url: extracted.video_url,
        caption: `${caption}\n\nCredit: @${handle}`,
        originalHandle: handle
      });
      Alert.alert('Auto-published!', `ID: ${res.data.publishedId}`);
    } catch(e){ Alert.alert('Publish failed', JSON.stringify(e.response?.data || e.message)); }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.toggleRow}>
        <Text style={[styles.toggleText, mode==='any' && styles.active]} onPress={()=>setMode('any')}>📲 Repost Anything</Text>
        <Text style={[styles.toggleText, mode==='own' && styles.active]} onPress={()=>setMode('own')}>🏢 Auto-Publish Own</Text>
      </View>
      <Text style={styles.title}>{mode==='any' ? 'Repost ANY Public Reel (Share Sheet)' : 'Auto-Publish Own Business Reels'}</Text>
      <Text style={styles.note}>{mode==='any' ? 'Downloads to camera roll + opens Instagram. App Store safe.' : 'Graph API container flow - only YOUR Business account.'}</Text>
      <Button title="Paste IG Link" onPress={pasteLink} />
      <TextInput style={styles.input} placeholder="https://www.instagram.com/reel/..." value={link} onChangeText={setLink} autoCapitalize="none" />
      <Button title={loading ? 'Extracting...' : '1. Extract Video'} onPress={extractVideo} disabled={loading} />
      {extracted && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>✅ Extracted via {extracted.method}</Text>
          <Text style={styles.small}>Author: @{extracted.author || handle}</Text>
          <Text style={styles.small} numberOfLines={2}>Video: {extracted.video_url?.substring(0,80)}...</Text>
        </View>
      )}
      <TextInput style={styles.input} placeholder="Original creator handle" value={handle} onChangeText={setHandle} />
      <TextInput style={[styles.input, {height:90}]} multiline placeholder="Caption - will add Credit automatically" value={caption} onChangeText={setCaption} />
      <View style={styles.permRow}>
        <Switch value={hasPermission} onValueChange={setHasPermission} />
        <Text style={styles.permText}>I have permission from @{handle || 'creator'}</Text>
      </View>
      {mode==='any' ? (
        <Button title={loading ? 'Processing...' : '2. Download + Open in Instagram'} onPress={repostAnything} disabled={loading || !extracted} color="#000" />
      ) : (
        <Button title={loading ? 'Publishing...' : '2. Auto-Publish to my Business IG'} onPress={autoPublishOwn} disabled={loading || !extracted} />
      )}
      <Text style={styles.footer}>Copy Link -> Extract og:video / yt-dlp -> Download -> Share Sheet -> Instagram</Text>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container:{ padding:20, gap:12, paddingBottom:60 },
  toggleRow:{ flexDirection:'row', gap:10, marginBottom:10 },
  toggleText:{ padding:8, borderWidth:1, borderColor:'#ddd', borderRadius:20, paddingHorizontal:14 },
  active:{ backgroundColor:'#000', color:'#fff', borderColor:'#000' },
  title:{ fontSize:17, fontWeight:'700' },
  note:{ fontSize:12, color:'#666' },
  input:{ borderWidth:1, borderColor:'#ddd', borderRadius:8, padding:10 },
  card:{ backgroundColor:'#f0f0f0', padding:12, borderRadius:8 },
  cardTitle:{ fontWeight:'700' },
  small:{ fontSize:11, color:'#444' },
  permRow:{ flexDirection:'row', alignItems:'center', gap:8, marginTop:5 },
  permText:{ fontSize:12, flex:1 },
  footer:{ fontSize:10, color:'#888', marginTop:20, textAlign:'center' }
});

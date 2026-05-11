# Migrations Supabase pour Niavo Social

## ⚠️ IMPORTANT - Exécutez CETTE section en premier

Si vous avez déjà des tables, ce script nettoie COMPLÈTEMENT puis recréé tout proprement.

### SCRIPT DE NETTOYAGE COMPLET (Exécutez CECI D'ABORD)

```sql
-- Désactiver les contraintes de clés étrangères temporairement
SET session_replication_role = replica;

-- Supprimer TOUTES les tables anciennes (dans le bon ordre)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS posts CASCADE;

-- Réactiver les contraintes
SET session_replication_role = DEFAULT;
```

✅ **Exécutez UNIQUEMENT ce script ci-dessus d'abord**

---

## APRÈS : Recréer Toutes les Tables Avec UUID

Une fois que le nettoyage est terminé (pas d'erreur), exécutez ce deuxième script :

```sql
-- CRÉER POSTS AVEC UUID
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CRÉER LIKES
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id)
);

-- CRÉER COMMENTS
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CRÉER MESSAGES
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CRÉER NOTIFICATIONS (avec UUID compatible)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CRÉER LES INDEX
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

✅ **Exécutez ce deuxième script après le nettoyage**

---

## PUIS : Ajouter les Colonnes à Profiles



```sql
-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politiques pour profiles
CREATE POLICY "Les profils sont publics" ON profiles FOR SELECT USING (true);
CREATE POLICY "Les utilisateurs peuvent modifier leur profil" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Les utilisateurs peuvent créer leur profil"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Politiques pour posts
CREATE POLICY "Les posts sont publics" ON posts FOR SELECT USING (true);
CREATE POLICY "Les utilisateurs peuvent créer des posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Les utilisateurs peuvent modifier leurs posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Les utilisateurs peuvent supprimer leurs posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour likes
CREATE POLICY "Les likes sont publics" ON likes FOR SELECT USING (true);
CREATE POLICY "Les utilisateurs peuvent aimer" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Les utilisateurs peuvent retirer leurs likes" ON likes FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour comments
CREATE POLICY "Les commentaires sont publics" ON comments FOR SELECT USING (true);
CREATE POLICY "Les utilisateurs peuvent commenter" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Les utilisateurs peuvent supprimer leurs commentaires" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour messages
CREATE POLICY "Les utilisateurs peuvent voir leurs messages" ON messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "Les utilisateurs peuvent envoyer des messages" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id
);

-- Politiques pour notifications
CREATE POLICY "Les utilisateurs peuvent voir leurs notifications" ON notifications FOR SELECT USING (
  auth.uid() = user_id
);
CREATE POLICY "Système peut créer des notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Les utilisateurs peuvent supprimer leurs notifications" ON notifications FOR DELETE USING (
  auth.uid() = user_id
);
```

## 8. Créer des fonctions pour les triggers (optionnel mais recommandé)

```sql
-- Fonction pour créer une notification quand quelqu'un like un post
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, actor_id, post_id)
  SELECT p.user_id, 'like', NEW.user_id, NEW.post_id
  FROM posts p WHERE p.id = NEW.post_id AND p.user_id != NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour les likes
DROP TRIGGER IF EXISTS trigger_notify_like ON likes;
CREATE TRIGGER trigger_notify_like AFTER INSERT ON likes
FOR EACH ROW EXECUTE FUNCTION notify_on_like();

-- Fonction pour les commentaires
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, actor_id, post_id, comment_id)
  SELECT p.user_id, 'comment', NEW.user_id, NEW.post_id, NEW.id
  FROM posts p WHERE p.id = NEW.post_id AND p.user_id != NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour les commentaires
DROP TRIGGER IF EXISTS trigger_notify_comment ON comments;
CREATE TRIGGER trigger_notify_comment AFTER INSERT ON comments
FOR EACH ROW EXECUTE FUNCTION notify_on_comment();
```

## Notes d'installation - Procédure Complète

### ✅ ÉTAPE 1 : Script Principal (OBLIGATOIRE)
1. Allez à votre console Supabase
2. Ouvrez l'éditeur SQL
3. **Copiez TOUT le grand script SQL** (du début jusqu'à `CREATE INDEX idx_notifications_created_at`)
4. **Collez-le dans l'éditeur**
5. **Cliquez sur "RUN"** et attendez la fin (pas d'erreur ✓)

### ✅ ÉTAPE 2 : Colonnes Profiles
1. Copiez le script des colonnes `ALTER TABLE profiles...`
2. Collez dans une **nouvelle query**
3. Cliquez sur "RUN"

### ✅ ÉTAPE 3 : RLS (Row Level Security)
1. Copiez le script RLS complet
2. Collez dans une **nouvelle query**
3. Cliquez sur "RUN"

### ✅ ÉTAPE 4 : Triggers (Optionnel)
Si vous voulez les notifications automatiques au like/commentaire :
1. Copiez le script des triggers
2. Collez dans une **nouvelle query**
3. Cliquez sur "RUN"

### ✅ ÉTAPE 5 : Activer Realtime
1. Dans Supabase, allez à **Realtime**
2. Activez les mises à jour pour :
   - ✅ posts
   - ✅ likes
   - ✅ comments
   - ✅ messages
   - ✅ notifications

### ✅ ÉTAPE 6 : Tester l'Application
Lancez votre app React - tout devrait fonctionner ! 🚀

---

## ⚠️ En Cas de Problème

**Erreur : "Key columns are incompatible"**
→ Assurez-vous que le script principal a été exécuté EN ENTIER (ne pas exécuter par section)

**Erreur : "Already exists"**
→ Les tables existent déjà. Le script principal supprime tout automatiquement.

**Les notifications n'arrivent pas**
→ Vérifiez que Realtime est activé pour la table `notifications`

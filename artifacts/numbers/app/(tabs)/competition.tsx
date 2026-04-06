import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Competition, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function CompetitionCard({
  comp,
  isActive,
  isJoined,
  onJoin,
  onSwitch,
  onEdit,
  onLeave,
}: {
  comp: Competition;
  isActive: boolean;
  isJoined: boolean;
  onJoin: () => void;
  onSwitch: () => void;
  onEdit?: () => void;
  onLeave?: () => void;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.compCard,
        {
          backgroundColor: isActive ? "rgba(155,111,232,0.1)" : colors.card,
          borderColor: isActive ? colors.violet : colors.border,
        },
      ]}
    >
      <View style={styles.compCardTop}>
        <View style={styles.compCardInfo}>
          {isActive && (
            <View style={[styles.activeBadge, { backgroundColor: colors.violet }]}>
              <Text style={[styles.activeBadgeText, { color: colors.foreground }]}>ACTIVE</Text>
            </View>
          )}
          {!isActive && isJoined && (
            <View style={[styles.activeBadge, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
              <Text style={[styles.activeBadgeText, { color: colors.mutedForeground }]}>JOINED</Text>
            </View>
          )}
          <Text style={[styles.compCardName, { color: colors.foreground }]} numberOfLines={1}>
            {comp.name}
          </Text>
          <Text style={[styles.compCardVenue, { color: colors.lavender }]} numberOfLines={1}>
            {comp.venue}
          </Text>
        </View>
        {isActive ? (
          <View style={[styles.joinedBtn, { borderColor: colors.violet }]}>
            <Feather name="check" size={13} color={colors.violet} />
            <Text style={[styles.joinedBtnText, { color: colors.violet }]}>Active</Text>
          </View>
        ) : isJoined ? (
          <Pressable
            onPress={onSwitch}
            style={({ pressed }) => [
              styles.switchBtn,
              { borderColor: colors.violet, opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <Feather name="repeat" size={12} color={colors.violet} />
            <Text style={[styles.switchBtnText, { color: colors.violet }]}>Switch</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={onJoin}
            style={({ pressed }) => [
              styles.joinBtn,
              { backgroundColor: colors.violet, opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <Text style={[styles.joinBtnText, { color: colors.foreground }]}>Join</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.compCardMeta}>
        <View style={styles.metaItem}>
          <Feather name="map-pin" size={11} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{comp.location}</Text>
        </View>
        <View style={styles.metaDot} />
        <View style={styles.metaItem}>
          <Feather name="calendar" size={11} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {comp.startDate === comp.endDate ? comp.startDate : `${comp.startDate} – ${comp.endDate}`}
          </Text>
        </View>
        <View style={styles.metaDot} />
        <View style={styles.metaItem}>
          <Feather name="users" size={11} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{comp.memberCount}</Text>
        </View>
        {isJoined && onEdit && (
          <>
            <View style={styles.metaDot} />
            <Pressable
              onPress={onEdit}
              style={({ pressed }) => [styles.editDatesBtn, { opacity: pressed ? 0.6 : 1 }]}
              hitSlop={8}
            >
              <Feather name="edit-2" size={11} color={colors.violet} />
              <Text style={[styles.editDatesBtnText, { color: colors.violet }]}>Edit dates</Text>
            </Pressable>
          </>
        )}
        {isJoined && onLeave && (
          <>
            <View style={styles.metaDot} />
            <Pressable
              onPress={onLeave}
              style={({ pressed }) => [styles.editDatesBtn, { opacity: pressed ? 0.6 : 1 }]}
              hitSlop={8}
            >
              <Feather name="log-out" size={11} color="#ef4444" />
              <Text style={[styles.editDatesBtnText, { color: "#ef4444" }]}>Leave</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

function FormField({
  label,
  placeholder,
  value,
  onChangeText,
  hint,
  keyboardType,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  hint?: string;
  keyboardType?: "default" | "email-address";
}) {
  const colors = useColors();
  return (
    <View style={styles.fieldWrapper}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        style={[
          styles.fieldInput,
          { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border },
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize="words"
        returnKeyType="next"
      />
      {hint ? (
        <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

export default function CompetitionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentNumber, submitCurrentNumber, competition, allCompetitions, joinCompetition, switchCompetition, leaveCompetition, createCompetition, updateCompetitionDates, userName, refreshCompetitions, scheduleImages, uploadSchedule, scoringImages, uploadScoring, joinedCompetitionIds } =
    useApp();
  const router = useRouter();

  const [pendingSchedule, setPendingSchedule] = useState<string | null>(null);
  const [publishingSchedule, setPublishingSchedule] = useState(false);
  const [pendingScoring, setPendingScoring] = useState<string | null>(null);
  const [publishingScoring, setPublishingScoring] = useState(false);

  // Success toast
  const [toastMsg, setToastMsg] = useState("");
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.delay(2400),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
    toastTimer.current = setTimeout(() => { toastOpacity.setValue(0); }, 3000);
  };
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshCompetitions();
    setRefreshing(false);
  }, [refreshCompetitions]);

  const [search, setSearch] = useState("");
  const [showQuickReport, setShowQuickReport] = useState(false);
  const [reportNumInput, setReportNumInput] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const [newName, setNewName] = useState("");
  const [newVenue, setNewVenue] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");

  // Edit dates modal
  const [editingComp, setEditingComp] = useState<Competition | null>(null);
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");

  // Leave competition confirmation
  const [leavingComp, setLeavingComp] = useState<Competition | null>(null);

  const openEditDates = useCallback((comp: Competition) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingComp(comp);
    setEditStartDate(comp.startDate);
    setEditEndDate(comp.endDate);
  }, []);

  const handleSaveDates = useCallback(() => {
    if (!editingComp || !editStartDate.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateCompetitionDates(editingComp.id, editStartDate.trim(), editEndDate.trim() || editStartDate.trim());
    setEditingComp(null);
  }, [editingComp, editStartDate, editEndDate, updateCompetitionDates]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allCompetitions;
    return allCompetitions.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.venue.toLowerCase().includes(q)
    );
  }, [search, allCompetitions]);

  const handleQuickReport = () => {
    const n = parseInt(reportNumInput, 10);
    if (!isNaN(n) && n > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      submitCurrentNumber(n);
    }
    setReportNumInput("");
    setShowQuickReport(false);
  };

  const handleCreate = () => {
    if (!newName.trim() || !newLocation.trim() || !newStartDate.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    createCompetition(
      newName.trim(),
      newVenue.trim() || newLocation.trim(),
      newLocation.trim(),
      newStartDate.trim(),
      newEndDate.trim() || newStartDate.trim()
    );
    setNewName("");
    setNewVenue("");
    setNewLocation("");
    setNewStartDate("");
    setNewEndDate("");
    setShowCreate(false);
    setSearch("");
  };

  const handleJoin = (comp: Competition) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    joinCompetition(comp.id);
  };

  const handleSwitch = (comp: Competition) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    switchCompetition(comp.id);
  };

  const handlePickSchedule = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.8,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const mime = asset.mimeType ?? "image/jpeg";
    setPendingSchedule(`data:${mime};base64,${asset.base64}`);
  };

  const handlePublishSchedule = async () => {
    if (!pendingSchedule) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPublishingSchedule(true);
    await uploadSchedule(pendingSchedule);
    setPublishingSchedule(false);
    setPendingSchedule(null);
    showToast("Schedule published to competition");
  };

  const handlePickScoring = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.8,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const mime = asset.mimeType ?? "image/jpeg";
    setPendingScoring(`data:${mime};base64,${asset.base64}`);
  };

  const handlePublishScoring = async () => {
    if (!pendingScoring) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPublishingScoring(true);
    await uploadScoring(pendingScoring);
    setPublishingScoring(false);
    setPendingScoring(null);
    showToast("Rubric published to competition");
  };

  const isJoined = !!competition && joinedCompetitionIds.includes(competition.id);
  const canCreate = newName.trim().length > 0 && newLocation.trim().length > 0 && newStartDate.trim().length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: topPad + 12,
            paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 84,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.violet}
            colors={[colors.violet]}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.screenTitle, { color: colors.lavender }]}>COMPETITION</Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCreate(true);
            }}
            style={({ pressed }) => [
              styles.createBtn,
              { backgroundColor: colors.violet, opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <Feather name="plus" size={14} color={colors.foreground} />
            <Text style={[styles.createBtnText, { color: colors.foreground }]}>Create</Text>
          </Pressable>
        </View>

        {/* Live tracker strip for active competition */}
        {competition && (
          <View style={[styles.trackerStrip, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.stripLeft}>
              <View style={[styles.liveDot, { backgroundColor: colors.green }]} />
              <View>
                <Text style={[styles.stripCompName, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {competition.name}
                </Text>
                <View style={styles.stripNumberRow}>
                  <Text style={[styles.stripLabel, { color: colors.mutedForeground }]}>ON STAGE</Text>
                  <Text style={[styles.stripNumber, { color: colors.lavender }]}>{currentNumber}</Text>
                </View>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.quickReportBtn,
                { backgroundColor: colors.violet, opacity: pressed ? 0.75 : 1 },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowQuickReport(true);
              }}
            >
              <Feather name="send" size={14} color={colors.foreground} />
              <Text style={[styles.quickReportText, { color: colors.foreground }]}>Report</Text>
            </Pressable>
          </View>
        )}

        {/* Schedule section for active competition */}
        {competition && (
          <View style={[styles.scheduleSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.scheduleSectionHeader}>
              <MaterialCommunityIcons name="calendar-clock" size={16} color={colors.violet} />
              <Text style={[styles.scheduleSectionTitle, { color: colors.foreground }]}>Schedule</Text>
              <Pressable
                onPress={() => router.push("/schedule")}
                style={({ pressed }) => [styles.scheduleViewBtn, { opacity: pressed ? 0.6 : 1 }]}
              >
                {scheduleImages.length > 0 && (
                  <View style={[styles.countBadge, { backgroundColor: colors.violet + "33" }]}>
                    <Text style={[styles.countBadgeText, { color: colors.violet }]}>{scheduleImages.length}</Text>
                  </View>
                )}
                <Text style={[styles.scheduleViewBtnText, { color: colors.violet }]}>View full</Text>
                <Feather name="chevron-right" size={13} color={colors.violet} />
              </Pressable>
            </View>

            {scheduleImages.length > 0 ? (
              <View style={styles.thumbStripWrap}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbStrip}>
                  {scheduleImages.map((img) => (
                    <Pressable key={img.id} onPress={() => router.push("/schedule")}>
                      <Image source={{ uri: img.image }} style={styles.scheduleThumbSmall} resizeMode="cover" />
                    </Pressable>
                  ))}
                  {isJoined && (
                    <Pressable
                      onPress={handlePickSchedule}
                      style={[styles.thumbAddBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    >
                      <Feather name="plus" size={20} color={colors.violet} />
                    </Pressable>
                  )}
                </ScrollView>
              </View>
            ) : isJoined ? (
              <Pressable
                onPress={handlePickSchedule}
                style={({ pressed }) => [
                  styles.scheduleUploadArea,
                  { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Feather name="upload" size={18} color={colors.mutedForeground} />
                <Text style={[styles.scheduleUploadText, { color: colors.mutedForeground }]}>
                  Upload schedule photo
                </Text>
                <Text style={[styles.scheduleUploadHint, { color: colors.mutedForeground }]}>
                  Visible to all members
                </Text>
              </Pressable>
            ) : (
              <View style={[styles.scheduleUploadArea, { borderColor: colors.border, opacity: 0.5 }]}>
                <Feather name="lock" size={18} color={colors.mutedForeground} />
                <Text style={[styles.scheduleUploadText, { color: colors.mutedForeground }]}>
                  Members only
                </Text>
                <Text style={[styles.scheduleUploadHint, { color: colors.mutedForeground }]}>
                  Join to upload the schedule
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Scoring section for active competition */}
        {competition && (
          <View style={[styles.scheduleSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.scheduleSectionHeader}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={16} color={colors.lilac} />
              <Text style={[styles.scheduleSectionTitle, { color: colors.foreground }]}>Scoring</Text>
              <Pressable
                onPress={() => router.push("/scoring")}
                style={({ pressed }) => [styles.scheduleViewBtn, { opacity: pressed ? 0.6 : 1 }]}
              >
                {scoringImages.length > 0 && (
                  <View style={[styles.countBadge, { backgroundColor: colors.violet + "33" }]}>
                    <Text style={[styles.countBadgeText, { color: colors.violet }]}>{scoringImages.length}</Text>
                  </View>
                )}
                <Text style={[styles.scheduleViewBtnText, { color: colors.violet }]}>View full</Text>
                <Feather name="chevron-right" size={13} color={colors.violet} />
              </Pressable>
            </View>

            {scoringImages.length > 0 ? (
              <View style={styles.thumbStripWrap}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbStrip}>
                  {scoringImages.map((img) => (
                    <Pressable key={img.id} onPress={() => router.push("/scoring")}>
                      <Image source={{ uri: img.image }} style={styles.scheduleThumbSmall} resizeMode="cover" />
                    </Pressable>
                  ))}
                  {isJoined && (
                    <Pressable
                      onPress={handlePickScoring}
                      style={[styles.thumbAddBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    >
                      <Feather name="plus" size={20} color={colors.violet} />
                    </Pressable>
                  )}
                </ScrollView>
              </View>
            ) : isJoined ? (
              <Pressable
                onPress={handlePickScoring}
                style={({ pressed }) => [
                  styles.scheduleUploadArea,
                  { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Feather name="upload" size={18} color={colors.mutedForeground} />
                <Text style={[styles.scheduleUploadText, { color: colors.mutedForeground }]}>
                  Upload rubric / docs
                </Text>
                <Text style={[styles.scheduleUploadHint, { color: colors.mutedForeground }]}>
                  Visible to all members
                </Text>
              </Pressable>
            ) : (
              <View style={[styles.scheduleUploadArea, { borderColor: colors.border, opacity: 0.5 }]}>
                <Feather name="lock" size={18} color={colors.mutedForeground} />
                <Text style={[styles.scheduleUploadText, { color: colors.mutedForeground }]}>
                  Members only
                </Text>
                <Text style={[styles.scheduleUploadHint, { color: colors.mutedForeground }]}>
                  Join to upload scoring rubrics
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Search bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search competitions..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Feather name="x" size={15} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        {/* Results label */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          {search.trim() ? `${filtered.length} RESULT${filtered.length !== 1 ? "S" : ""}` : "ALL COMPETITIONS"}
        </Text>

        {/* Competition list */}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="search" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No competitions found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Try a different search, or create one for others to join.
            </Text>
            <Pressable
              onPress={() => setShowCreate(true)}
              style={[styles.emptyCreateBtn, { borderColor: colors.violet }]}
            >
              <Feather name="plus" size={14} color={colors.violet} />
              <Text style={[styles.emptyCreateText, { color: colors.violet }]}>Create Competition</Text>
            </Pressable>
          </View>
        ) : (
          filtered.map((comp) => (
            <CompetitionCard
              key={comp.id}
              comp={comp}
              isActive={competition?.id === comp.id}
              isJoined={joinedCompetitionIds.includes(comp.id)}
              onJoin={() => handleJoin(comp)}
              onSwitch={() => handleSwitch(comp)}
              onEdit={() => openEditDates(comp)}
              onLeave={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setLeavingComp(comp);
              }}
            />
          ))
        )}
      </ScrollView>

      {/* Quick Report Modal */}
      <Modal
        visible={showQuickReport}
        animationType="slide"
        transparent
        onRequestClose={() => setShowQuickReport(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowQuickReport(false)}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Report Stage Number</Text>
              <TextInput
                style={[
                  styles.bigInput,
                  { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border },
                ]}
                placeholder="Enter #"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="number-pad"
                value={reportNumInput}
                onChangeText={setReportNumInput}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleQuickReport}
                maxLength={4}
              />
              <View style={styles.modalBtns}>
                <Pressable
                  style={[styles.cancelBtn, { borderColor: colors.border }]}
                  onPress={() => setShowQuickReport(false)}
                >
                  <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.submitBtn, { backgroundColor: colors.violet }]}
                  onPress={handleQuickReport}
                >
                  <Text style={[styles.submitText, { color: colors.foreground }]}>Submit</Text>
                </Pressable>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Create Competition Modal */}
      <Modal
        visible={showCreate}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreate(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowCreate(false)}>
            <View
              style={[styles.createSheet, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Pressable>
                <View style={styles.sheetHandle}>
                  <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
                </View>

                <View style={styles.sheetHeader}>
                  <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                    Create Competition
                  </Text>
                  <Pressable onPress={() => setShowCreate(false)} hitSlop={8}>
                    <Feather name="x" size={20} color={colors.mutedForeground} />
                  </Pressable>
                </View>

                <Text style={[styles.sheetSubtitle, { color: colors.mutedForeground }]}>
                  Others can search for and join your competition.
                </Text>

                <FormField
                  label="COMPETITION NAME *"
                  placeholder="e.g. STARBOUND 2026"
                  value={newName}
                  onChangeText={setNewName}
                />
                <FormField
                  label="VENUE / FACILITY"
                  placeholder="e.g. Marriott Convention Center"
                  value={newVenue}
                  onChangeText={setNewVenue}
                  hint="Optional — the specific building or hall"
                />
                <FormField
                  label="LOCATION *"
                  placeholder="e.g. Atlanta, GA"
                  value={newLocation}
                  onChangeText={setNewLocation}
                />
                <FormField
                  label="START DATE *"
                  placeholder="e.g. Apr 6, 2026"
                  value={newStartDate}
                  onChangeText={setNewStartDate}
                />
                <FormField
                  label="END DATE"
                  placeholder="e.g. Apr 7, 2026 (leave blank if 1 day)"
                  value={newEndDate}
                  onChangeText={setNewEndDate}
                />

                <Pressable
                  style={({ pressed }) => [
                    styles.createSubmitBtn,
                    {
                      backgroundColor: canCreate ? colors.violet : colors.surface,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                  onPress={handleCreate}
                >
                  <MaterialCommunityIcons
                    name="trophy-outline"
                    size={18}
                    color={canCreate ? colors.foreground : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.createSubmitText,
                      { color: canCreate ? colors.foreground : colors.mutedForeground },
                    ]}
                  >
                    Create & Join
                  </Text>
                </Pressable>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Schedule preview modal */}
      <Modal visible={!!pendingSchedule} animationType="slide" transparent statusBarTranslucent>
        <View style={[styles.previewOverlay, { backgroundColor: "rgba(0,0,0,0.85)" }]}>
          <View
            style={[
              styles.previewSheet,
              { backgroundColor: colors.background, paddingBottom: Platform.OS === "web" ? 32 : insets.bottom + 20 },
            ]}
          >
            {/* Preview header */}
            <View style={styles.previewHeader}>
              <Text style={[styles.previewTitle, { color: colors.foreground }]}>Review Schedule</Text>
              <Pressable
                onPress={() => setPendingSchedule(null)}
                style={({ pressed }) => [styles.previewClose, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <Text style={[styles.previewSub, { color: colors.mutedForeground }]}>
              This will be added to the schedule gallery for{" "}
              <Text style={{ color: colors.lavender }}>{competition?.name}</Text>
            </Text>

            {/* Preview image */}
            {pendingSchedule && (
              <ScrollView
                style={styles.previewScroll}
                contentContainerStyle={styles.previewScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <Image
                  source={{ uri: pendingSchedule }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              </ScrollView>
            )}

            {/* Action buttons */}
            <View style={styles.previewBtns}>
              <Pressable
                onPress={async () => {
                  setPendingSchedule(null);
                  await handlePickSchedule();
                }}
                style={({ pressed }) => [
                  styles.previewRetakeBtn,
                  { borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Feather name="refresh-cw" size={15} color={colors.foreground} />
                <Text style={[styles.previewRetakeBtnText, { color: colors.foreground }]}>
                  Choose different
                </Text>
              </Pressable>

              <Pressable
                onPress={handlePublishSchedule}
                disabled={publishingSchedule}
                style={({ pressed }) => [
                  styles.previewPublishBtn,
                  { backgroundColor: colors.violet, opacity: pressed || publishingSchedule ? 0.8 : 1 },
                ]}
              >
                {publishingSchedule ? (
                  <ActivityIndicator size="small" color={colors.foreground} />
                ) : (
                  <Feather name="upload-cloud" size={16} color={colors.foreground} />
                )}
                <Text style={[styles.previewPublishBtnText, { color: colors.foreground }]}>
                  {publishingSchedule ? "Publishing…" : "Add to Gallery"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Scoring preview modal */}
      <Modal visible={!!pendingScoring} animationType="slide" transparent statusBarTranslucent>
        <View style={[styles.previewOverlay, { backgroundColor: "rgba(0,0,0,0.85)" }]}>
          <View
            style={[
              styles.previewSheet,
              { backgroundColor: colors.background, paddingBottom: Platform.OS === "web" ? 32 : insets.bottom + 20 },
            ]}
          >
            <View style={styles.previewHeader}>
              <Text style={[styles.previewTitle, { color: colors.foreground }]}>Review Rubric</Text>
              <Pressable
                onPress={() => setPendingScoring(null)}
                style={({ pressed }) => [styles.previewClose, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <Text style={[styles.previewSub, { color: colors.mutedForeground }]}>
              This will be added to the scoring gallery for{" "}
              <Text style={{ color: colors.lavender }}>{competition?.name}</Text>
            </Text>

            {pendingScoring && (
              <ScrollView
                style={styles.previewScroll}
                contentContainerStyle={styles.previewScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <Image
                  source={{ uri: pendingScoring }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              </ScrollView>
            )}

            <View style={styles.previewBtns}>
              <Pressable
                onPress={async () => {
                  setPendingScoring(null);
                  await handlePickScoring();
                }}
                style={({ pressed }) => [
                  styles.previewRetakeBtn,
                  { borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Feather name="refresh-cw" size={15} color={colors.foreground} />
                <Text style={[styles.previewRetakeBtnText, { color: colors.foreground }]}>
                  Choose different
                </Text>
              </Pressable>

              <Pressable
                onPress={handlePublishScoring}
                disabled={publishingScoring}
                style={({ pressed }) => [
                  styles.previewPublishBtn,
                  { backgroundColor: colors.violet, opacity: pressed || publishingScoring ? 0.8 : 1 },
                ]}
              >
                {publishingScoring ? (
                  <ActivityIndicator size="small" color={colors.foreground} />
                ) : (
                  <Feather name="upload-cloud" size={16} color={colors.foreground} />
                )}
                <Text style={[styles.previewPublishBtnText, { color: colors.foreground }]}>
                  {publishingScoring ? "Publishing…" : "Add to Gallery"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Dates Modal */}
      <Modal visible={!!editingComp} animationType="slide" transparent statusBarTranslucent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setEditingComp(null)}>
            <Pressable style={[styles.editDatesSheet, { backgroundColor: colors.background }]}>
              {/* Header */}
              <View style={styles.editDatesHeader}>
                <View>
                  <Text style={[styles.editDatesTitle, { color: colors.foreground }]}>Edit Dates</Text>
                  {editingComp && (
                    <Text style={[styles.editDatesSubtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {editingComp.name}
                    </Text>
                  )}
                </View>
                <Pressable
                  onPress={() => setEditingComp(null)}
                  style={({ pressed }) => [styles.previewClose, { opacity: pressed ? 0.6 : 1 }]}
                >
                  <Feather name="x" size={20} color={colors.mutedForeground} />
                </Pressable>
              </View>

              <View style={styles.editDatesFields}>
                <FormField
                  label="Start Date"
                  placeholder="e.g. Apr 6, 2026"
                  value={editStartDate}
                  onChangeText={setEditStartDate}
                  hint="Day the competition begins"
                />
                <FormField
                  label="End Date"
                  placeholder="e.g. Apr 7, 2026"
                  value={editEndDate}
                  onChangeText={setEditEndDate}
                  hint="Leave blank if same as start date"
                />
              </View>

              <View style={styles.editDatesBtns}>
                <Pressable
                  onPress={() => setEditingComp(null)}
                  style={({ pressed }) => [
                    styles.cancelBtn,
                    { borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveDates}
                  disabled={!editStartDate.trim()}
                  style={({ pressed }) => [
                    styles.submitBtn,
                    {
                      flexDirection: "row",
                      gap: 6,
                      backgroundColor: editStartDate.trim() ? colors.violet : colors.surface,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Feather name="check" size={15} color={editStartDate.trim() ? colors.foreground : colors.mutedForeground} />
                  <Text style={[styles.submitText, { color: editStartDate.trim() ? colors.foreground : colors.mutedForeground }]}>
                    Save Dates
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Leave Competition Confirmation Modal */}
      <Modal visible={!!leavingComp} animationType="slide" transparent statusBarTranslucent>
        <Pressable style={styles.modalOverlay} onPress={() => setLeavingComp(null)}>
          <Pressable style={[styles.leaveSheet, { backgroundColor: colors.background }]}>
            {/* Warning icon */}
            <View style={[styles.leaveIconWrap, { backgroundColor: "#ef444420" }]}>
              <Feather name="log-out" size={22} color="#ef4444" />
            </View>
            <Text style={[styles.leaveTitle, { color: colors.foreground }]}>Leave Competition?</Text>
            <Text style={[styles.leaveSub, { color: colors.mutedForeground }]}>
              You'll be removed from{" "}
              <Text style={{ color: colors.lavender, fontFamily: "Inter_600SemiBold" }}>
                {leavingComp?.name}
              </Text>
              {leavingComp && competition?.id === leavingComp.id
                ? " and switched to another competition."
                : ". You can rejoin at any time."}
            </Text>
            <View style={styles.leaveBtns}>
              <Pressable
                onPress={() => setLeavingComp(null)}
                style={({ pressed }) => [
                  styles.cancelBtn,
                  { borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (!leavingComp) return;
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  leaveCompetition(leavingComp.id);
                  setLeavingComp(null);
                }}
                style={({ pressed }) => [
                  styles.leaveConfirmBtn,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Feather name="log-out" size={14} color="#fff" />
                <Text style={[styles.leaveConfirmText, { color: "#fff" }]}>Leave</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Success toast */}
      <Animated.View
        style={[
          styles.toast,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            bottom: Platform.OS === "web" ? 32 : insets.bottom + 100,
            opacity: toastOpacity,
          },
        ]}
        pointerEvents="none"
      >
        <View style={[styles.toastIcon, { backgroundColor: "#22c55e22" }]}>
          <Feather name="check-circle" size={16} color="#22c55e" />
        </View>
        <View style={styles.toastText}>
          <Text style={[styles.toastTitle, { color: colors.foreground }]}>Published!</Text>
          <Text style={[styles.toastSub, { color: colors.mutedForeground }]}>{toastMsg}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 22 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  createBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },

  trackerStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  stripLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stripCompName: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  stripNumberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stripLabel: {
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: "Inter_500Medium",
  },
  stripNumber: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  quickReportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  quickReportText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },

  sectionTitle: {
    fontSize: 10,
    letterSpacing: 3,
    fontFamily: "Inter_500Medium",
    marginBottom: 12,
  },

  compCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  compCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  compCardInfo: {
    flex: 1,
    gap: 3,
  },
  activeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  activeBadgeText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
  },
  compCardName: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  compCardVenue: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  joinBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 58,
    alignItems: "center",
  },
  joinBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  joinedBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  switchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  switchBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  joinedBtnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  compCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(210,195,246,0.3)",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  emptyCreateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyCreateText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },

  scheduleSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginBottom: 4,
  },
  scheduleSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scheduleSectionTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  scheduleViewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  scheduleViewBtnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  scheduleThumb: {
    width: "100%",
    height: 140,
    borderRadius: 10,
  },
  // Multi-upload thumbnail strip
  countBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 2,
  },
  countBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  thumbStripWrap: {
    marginHorizontal: -4,
  },
  thumbStrip: {
    paddingHorizontal: 4,
    gap: 8,
    paddingVertical: 4,
  },
  scheduleThumbSmall: {
    width: 110,
    height: 140,
    borderRadius: 10,
  },
  thumbAddBtn: {
    width: 110,
    height: 140,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  scheduleUploadArea: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: "center",
    gap: 6,
  },
  scheduleUploadText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  scheduleUploadHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  scheduleReplaceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
  },
  scheduleReplaceText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  createSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingBottom: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  sheetHandle: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  sheetSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },

  fieldWrapper: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    letterSpacing: 2,
    marginBottom: 7,
  },
  fieldInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  fieldHint: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 5,
    paddingHorizontal: 2,
  },

  createSubmitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 14,
    marginTop: 8,
  },
  createSubmitText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },

  bigInput: {
    height: 64,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: 4,
    marginBottom: 16,
    textAlign: "center",
  },
  modalBtns: {
    flexDirection: "row",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  submitBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  // Schedule preview modal
  previewOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  previewSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "90%",
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  previewTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  previewClose: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  previewSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
    marginBottom: 16,
  },
  previewScroll: {
    maxHeight: 360,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
  },
  previewScrollContent: {
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: undefined,
    aspectRatio: 0.75,
    borderRadius: 14,
  },
  previewBtns: {
    gap: 10,
  },
  previewRetakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 13,
  },
  previewRetakeBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  previewPublishBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 15,
  },
  previewPublishBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
  // Edit dates inline button (inside CompetitionCard)
  editDatesBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  editDatesBtnText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  // Edit dates modal
  editDatesSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  editDatesHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  editDatesTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  editDatesSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.3,
  },
  editDatesFields: {
    gap: 12,
    marginBottom: 20,
  },
  editDatesBtns: {
    flexDirection: "row",
    gap: 10,
  },
  // Leave confirmation modal
  leaveSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    alignItems: "center",
    gap: 12,
  },
  leaveIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  leaveTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  leaveSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 280,
  },
  leaveBtns: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    width: "100%",
  },
  leaveConfirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#ef4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  leaveConfirmText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  toast: {
    position: "absolute",
    left: 22,
    right: 22,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toastIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  toastText: { flex: 1 },
  toastTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  toastSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});

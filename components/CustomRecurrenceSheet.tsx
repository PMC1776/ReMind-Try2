import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/Button";
import { Spacing, BorderRadius } from "@/constants/theme";
import * as Haptics from "expo-haptics";
import DateTimePicker from "@react-native-community/datetimepicker";

type RecurrenceType =
  | { type: "once" }
  | { type: "eachTime" }
  | { type: "weekly"; days: boolean[]; timeStart?: string; timeEnd?: string; endDate?: string }
  | { type: "specific_dates"; dates: string[]; timeStart?: string; timeEnd?: string; endDate?: string };

interface CustomRecurrenceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  recurrence: RecurrenceType;
  setRecurrence: (recurrence: RecurrenceType) => void;
}

// Day Button Component
const DayButton = ({
  day,
  isSelected,
  onPress,
  colors,
}: {
  day: string;
  isSelected: boolean;
  onPress: () => void;
  colors: any;
}) => (
  <TouchableOpacity
    onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }}
    style={[
      styles.dayButton,
      {
        backgroundColor: isSelected ? colors.primary : "transparent",
        borderColor: isSelected ? colors.primary : colors.border,
      },
    ]}
  >
    <Text
      style={[
        styles.dayButtonText,
        { color: isSelected ? "#FFFFFF" : colors.text },
      ]}
    >
      {day}
    </Text>
  </TouchableOpacity>
);

// Toggle Switch Component
const ToggleSwitch = ({
  value,
  onValueChange,
  colors,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  colors: any;
}) => (
  <TouchableOpacity
    onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onValueChange(!value);
    }}
    style={[
      styles.toggleSwitch,
      { backgroundColor: value ? colors.primary : "#94A3B8" },
    ]}
  >
    <View
      style={[
        styles.toggleThumb,
        { transform: [{ translateX: value ? 20 : 2 }] },
      ]}
    />
  </TouchableOpacity>
);

// Interactive Calendar Component
const InteractiveCalendar = ({
  selectedDates,
  onDateToggle,
  colors,
  mode = "multiple",
}: {
  selectedDates: string[];
  onDateToggle: (date: string) => void;
  colors: any;
  mode?: "single" | "multiple";
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  }, [firstDayOfMonth, daysInMonth]);

  const formatDate = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  return (
    <View style={[styles.calendar, { backgroundColor: colors.backgroundDefault }]}>
      {/* Calendar Header */}
      <View style={styles.calendarHeader}>
        <TouchableOpacity
          onPress={goToPreviousMonth}
          style={styles.calendarNavButton}
        >
          <Feather name="chevron-left" size={20} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.calendarTitle, { color: colors.text }]}>
          {monthNames[month]} {year}
        </Text>

        <TouchableOpacity
          onPress={goToNextMonth}
          style={styles.calendarNavButton}
        >
          <Feather name="chevron-right" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Day Labels */}
      <View style={styles.calendarDayLabels}>
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <Text
            key={index}
            style={[styles.calendarDayLabel, { color: colors.tabIconDefault }]}
          >
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((day, index) => {
          if (!day) {
            return <View key={index} style={styles.calendarDay} />;
          }

          const dateString = formatDate(day);
          const isSelected = selectedDates.includes(dateString);
          const isPast =
            new Date(dateString) < new Date(new Date().setHours(0, 0, 0, 0));

          return (
            <TouchableOpacity
              key={index}
              onPress={() => {
                if (!isPast) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onDateToggle(dateString);
                }
              }}
              disabled={isPast}
              style={[
                styles.calendarDay,
                isSelected && {
                  backgroundColor: colors.primary,
                  borderRadius: BorderRadius.sm,
                },
              ]}
            >
              <Text
                style={[
                  styles.calendarDayText,
                  {
                    color: isSelected
                      ? "#FFFFFF"
                      : isPast
                      ? colors.tabIconDefault + "40"
                      : colors.text,
                  },
                  isSelected && styles.calendarDayTextSelected,
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// Time Picker Component
const TimePicker = ({
  label,
  value,
  onChange,
  colors,
}: {
  label: string;
  value: string;
  onChange: (time: string) => void;
  colors: any;
}) => {
  const [show, setShow] = useState(false);
  const [date, setDate] = useState(() => {
    const [hours, minutes] = value.split(":").map(Number);
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d;
  });

  const formatTime12Hour = (time24: string): string => {
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
  };

  const handleChange = (event: any, selectedDate?: Date) => {
    setShow(Platform.OS === "ios");
    if (selectedDate) {
      setDate(selectedDate);
      const hours = String(selectedDate.getHours()).padStart(2, "0");
      const minutes = String(selectedDate.getMinutes()).padStart(2, "0");
      onChange(`${hours}:${minutes}`);
    }
  };

  return (
    <View style={styles.timePickerContainer}>
      <Text style={[styles.timePickerLabel, { color: colors.tabIconDefault }]}>
        {label}
      </Text>
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShow(true);
        }}
        style={[
          styles.timePickerButton,
          { backgroundColor: colors.backgroundRoot, borderColor: colors.border },
        ]}
      >
        <Feather name="clock" size={16} color={colors.primary} />
        <Text style={[styles.timePickerText, { color: colors.text }]}>
          {formatTime12Hour(value)}
        </Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={date}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleChange}
        />
      )}
    </View>
  );
};

export function CustomRecurrenceSheet({
  isOpen,
  onClose,
  recurrence,
  setRecurrence,
}: CustomRecurrenceSheetProps) {
  const { colors } = useTheme();

  // Determine initial mode
  const initialMode = recurrence.type === "specific_dates" ? "dates" : "weekly";
  const [mode, setMode] = useState<"weekly" | "dates">(initialMode);

  // Weekly recurrence states
  const initialDays =
    recurrence.type === "weekly" && recurrence.days
      ? recurrence.days
      : Array(7).fill(false);
  const [selectedDays, setSelectedDays] = useState<boolean[]>(initialDays);
  const [enableTimeRange, setEnableTimeRange] = useState(
    recurrence.type === "weekly" && (recurrence.timeStart || recurrence.timeEnd)
  );
  const [timeStart, setTimeStart] = useState(
    recurrence.type === "weekly" ? recurrence.timeStart || "09:00" : "09:00"
  );
  const [timeEnd, setTimeEnd] = useState(
    recurrence.type === "weekly" ? recurrence.timeEnd || "17:00" : "17:00"
  );
  const [enableEndDate, setEnableEndDate] = useState(
    recurrence.type === "weekly" && !!recurrence.endDate
  );
  const [endDate, setEndDate] = useState(
    recurrence.type === "weekly" && recurrence.endDate ? recurrence.endDate : ""
  );

  // Specific dates state
  const initialDates =
    recurrence.type === "specific_dates" ? recurrence.dates : [];
  const [selectedDates, setSelectedDates] = useState<string[]>(initialDates);

  // Initialize time/end date from specific_dates if available
  useEffect(() => {
    if (recurrence.type === "specific_dates") {
      if (recurrence.timeStart || recurrence.timeEnd) {
        setEnableTimeRange(true);
        if (recurrence.timeStart) setTimeStart(recurrence.timeStart);
        if (recurrence.timeEnd) setTimeEnd(recurrence.timeEnd);
      }
      if (recurrence.endDate) {
        setEnableEndDate(true);
        setEndDate(recurrence.endDate);
      }
    }
  }, [recurrence]);

  const toggleDay = (index: number) => {
    const newDays = [...selectedDays];
    newDays[index] = !newDays[index];
    setSelectedDays(newDays);
  };

  const toggleDate = (date: string) => {
    setSelectedDates((prev) =>
      prev.includes(date)
        ? prev.filter((d) => d !== date)
        : [...prev, date].sort()
    );
  };

  const formatTime12Hour = (time24: string): string => {
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
  };

  const handleDone = () => {
    let newRecurrence: RecurrenceType;

    if (mode === "weekly") {
      newRecurrence = {
        type: "weekly",
        days: selectedDays,
        ...(enableTimeRange && { timeStart, timeEnd }),
        ...(enableEndDate && endDate && { endDate }),
      };
    } else {
      newRecurrence = {
        type: "specific_dates",
        dates: selectedDates,
        ...(enableTimeRange && { timeStart, timeEnd }),
        ...(enableEndDate && endDate && { endDate }),
      };
    }

    setRecurrence(newRecurrence);
    onClose();
  };

  const isValidSelection =
    mode === "weekly"
      ? selectedDays.some((d) => d)
      : selectedDates.length > 0;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Overlay */}
        <Pressable style={styles.overlay} onPress={onClose} />

        {/* Sheet */}
        <View style={[styles.sheet, { backgroundColor: colors.backgroundRoot }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Feather name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              How Often
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Mode Toggle */}
          <View style={styles.contentContainer}>
            <View
              style={[
                styles.modeToggle,
                { backgroundColor: colors.backgroundDefault },
              ]}
            >
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setMode("weekly");
                }}
                style={[
                  styles.modeButton,
                  mode === "weekly" && {
                    backgroundColor: colors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    {
                      color: mode === "weekly" ? "#FFFFFF" : colors.text,
                    },
                  ]}
                >
                  Recurring
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setMode("dates");
                }}
                style={[
                  styles.modeButton,
                  mode === "dates" && {
                    backgroundColor: colors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    {
                      color: mode === "dates" ? "#FFFFFF" : colors.text,
                    },
                  ]}
                >
                  Specific Dates
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.contentWrapper}>
                {/* Day/Date Selection (changes based on mode) */}
                {mode === "weekly" ? (
                  <View style={styles.section}>
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: colors.text },
                      ]}
                    >
                      Repeat on specific days
                    </Text>
                    <View style={styles.daysRow}>
                      {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                        <DayButton
                          key={`${day}-${index}`}
                          day={day}
                          isSelected={selectedDays[index]}
                          onPress={() => toggleDay(index)}
                          colors={colors}
                        />
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={styles.section}>
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: colors.text },
                      ]}
                    >
                      Select specific dates
                    </Text>
                    <Text
                      style={[
                        styles.sectionSubtitle,
                        { color: colors.tabIconDefault },
                      ]}
                    >
                      Tap dates to select or deselect them
                    </Text>
                    <InteractiveCalendar
                      selectedDates={selectedDates}
                      onDateToggle={toggleDate}
                      colors={colors}
                      mode="multiple"
                    />
                    {selectedDates.length > 0 && (
                      <View style={styles.datesSummary}>
                        <Text
                          style={[
                            styles.datesSummaryText,
                            { color: colors.tabIconDefault },
                          ]}
                        >
                          {selectedDates.length} date
                          {selectedDates.length !== 1 ? "s" : ""} selected
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Time Range (always visible) */}
                <View
                  style={[
                    styles.optionCard,
                    { backgroundColor: colors.backgroundDefault + "80" },
                  ]}
                >
                  <View style={styles.optionHeader}>
                    <View style={styles.optionLabelContainer}>
                      <Feather name="clock" size={20} color={colors.primary} />
                      <Text
                        style={[
                          styles.optionLabel,
                          { color: colors.text },
                        ]}
                      >
                        Only during certain times
                      </Text>
                    </View>
                    <ToggleSwitch
                      value={enableTimeRange}
                      onValueChange={setEnableTimeRange}
                      colors={colors}
                    />
                  </View>

                  {enableTimeRange && (
                    <View style={styles.timeRangeContainer}>
                      <TimePicker
                        label="Start Time"
                        value={timeStart}
                        onChange={setTimeStart}
                        colors={colors}
                      />
                      <TimePicker
                        label="End Time"
                        value={timeEnd}
                        onChange={setTimeEnd}
                        colors={colors}
                      />
                    </View>
                  )}
                </View>

                {/* End Date (always visible) */}
                <View
                  style={[
                    styles.optionCard,
                    { backgroundColor: colors.backgroundDefault + "80" },
                  ]}
                >
                  <View style={styles.optionHeader}>
                    <View style={styles.optionLabelContainer}>
                      <Feather
                        name="calendar"
                        size={20}
                        color={colors.primary}
                      />
                      <Text
                        style={[
                          styles.optionLabel,
                          { color: colors.text },
                        ]}
                      >
                        End date
                      </Text>
                    </View>
                    <ToggleSwitch
                      value={enableEndDate}
                      onValueChange={setEnableEndDate}
                      colors={colors}
                    />
                  </View>

                  {enableEndDate && (
                    <View style={styles.endDateContainer}>
                      <Text
                        style={[
                          styles.endDateLabel,
                          { color: colors.tabIconDefault },
                        ]}
                      >
                        Stop repeating after
                      </Text>
                      <InteractiveCalendar
                        selectedDates={endDate ? [endDate] : []}
                        onDateToggle={(date) => setEndDate(date)}
                        colors={colors}
                        mode="single"
                      />
                    </View>
                  )}
                </View>

                {/* Summary */}
                <View style={styles.summaryContainer}>
                  <Text
                    style={[
                      styles.summaryText,
                      { color: colors.tabIconDefault },
                    ]}
                  >
                    Your reminder will trigger on the selected {mode === "weekly" ? "days" : "dates"}
                    {enableTimeRange &&
                      ` between ${formatTime12Hour(timeStart)} and ${formatTime12Hour(timeEnd)}`}{" "}
                    when you are at the location
                    {enableEndDate &&
                      endDate &&
                      ` until ${new Date(endDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}`}
                    .
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Button
              title="Done"
              onPress={handleDone}
              disabled={!isValidSelection}
              style={styles.doneButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sheet: {
    width: "100%",
    maxWidth: 512,
    height: "90%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.xl,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  modeToggle: {
    flexDirection: "row",
    padding: 4,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  modeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  contentWrapper: {
    paddingBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  sectionSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  optionCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  optionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  timeRangeContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: Spacing.lg,
  },
  timePickerContainer: {
    flex: 1,
  },
  timePickerLabel: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  timePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  timePickerText: {
    fontSize: 14,
    fontWeight: "500",
  },
  endDateContainer: {
    marginTop: Spacing.lg,
  },
  endDateLabel: {
    fontSize: 12,
    marginBottom: Spacing.sm,
  },
  calendar: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  calendarNavButton: {
    padding: Spacing.xs,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  calendarDayLabels: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  calendarDayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDay: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDayText: {
    fontSize: 14,
  },
  calendarDayTextSelected: {
    fontWeight: "700",
  },
  datesSummary: {
    marginTop: Spacing.md,
    alignItems: "center",
  },
  datesSummaryText: {
    fontSize: 14,
  },
  summaryContainer: {
    marginTop: Spacing.lg,
    alignItems: "center",
  },
  summaryText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  footer: {
    padding: Spacing.xl,
    borderTopWidth: 1,
  },
  doneButton: {
    width: "100%",
  },
});

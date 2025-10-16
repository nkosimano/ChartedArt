import WidgetKit
import SwiftUI

// Widget Entry
struct ArtworkEntry: TimelineEntry {
    let date: Date
    let artwork: ArtworkData
    let orderStatus: OrderStatus?
}

// Artwork Data Model
struct ArtworkData {
    let id: String
    let title: String
    let artist: String
    let imageUrl: String
    let price: Double
}

// Order Status Model
struct OrderStatus {
    let orderId: String
    let status: String
    let trackingNumber: String?
    let estimatedDelivery: Date?
}

// Widget Provider
struct ArtworkProvider: TimelineProvider {
    func placeholder(in context: Context) -> ArtworkEntry {
        ArtworkEntry(
            date: Date(),
            artwork: ArtworkData(
                id: "placeholder",
                title: "Beautiful Sunset",
                artist: "Jane Doe",
                imageUrl: "",
                price: 49.99
            ),
            orderStatus: nil
        )
    }
    
    func getSnapshot(in context: Context, completion: @escaping (ArtworkEntry) -> ()) {
        let entry = placeholder(in: context)
        completion(entry)
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<ArtworkEntry>) -> ()) {
        // Fetch artwork of the day from API
        fetchArtworkOfTheDay { artwork, orderStatus in
            let currentDate = Date()
            let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: currentDate)!
            
            let entry = ArtworkEntry(
                date: currentDate,
                artwork: artwork,
                orderStatus: orderStatus
            )
            
            let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
            completion(timeline)
        }
    }
    
    private func fetchArtworkOfTheDay(completion: @escaping (ArtworkData, OrderStatus?) -> Void) {
        // In production, this would fetch from your API
        // For now, return placeholder data
        let artwork = ArtworkData(
            id: "daily",
            title: "Artwork of the Day",
            artist: "Featured Artist",
            imageUrl: "",
            price: 79.99
        )
        completion(artwork, nil)
    }
}

// Small Widget View
struct SmallWidgetView: View {
    let entry: ArtworkEntry
    
    var body: some View {
        ZStack {
            Color(red: 0.95, green: 0.95, blue: 0.97)
            
            VStack(alignment: .leading, spacing: 8) {
                // Placeholder for artwork image
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color.gray.opacity(0.3))
                    .frame(height: 80)
                
                Text(entry.artwork.title)
                    .font(.system(size: 12, weight: .semibold))
                    .lineLimit(1)
                
                Text("$\(String(format: "%.2f", entry.artwork.price))")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(Color(red: 1.0, green: 0.42, blue: 0.42))
            }
            .padding(12)
        }
    }
}

// Medium Widget View
struct MediumWidgetView: View {
    let entry: ArtworkEntry
    
    var body: some View {
        ZStack {
            Color(red: 0.95, green: 0.95, blue: 0.97)
            
            HStack(spacing: 12) {
                // Placeholder for artwork image
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color.gray.opacity(0.3))
                    .frame(width: 120, height: 120)
                
                VStack(alignment: .leading, spacing: 6) {
                    Text("Artwork of the Day")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(.gray)
                    
                    Text(entry.artwork.title)
                        .font(.system(size: 14, weight: .bold))
                        .lineLimit(2)
                    
                    Text(entry.artwork.artist)
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    HStack {
                        Text("$\(String(format: "%.2f", entry.artwork.price))")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(Color(red: 1.0, green: 0.42, blue: 0.42))
                        
                        Spacer()
                        
                        Image(systemName: "arrow.right.circle.fill")
                            .foregroundColor(Color(red: 1.0, green: 0.42, blue: 0.42))
                    }
                }
                .padding(.vertical, 4)
            }
            .padding(12)
        }
    }
}

// Large Widget View (with order status)
struct LargeWidgetView: View {
    let entry: ArtworkEntry
    
    var body: some View {
        ZStack {
            Color(red: 0.95, green: 0.95, blue: 0.97)
            
            VStack(spacing: 12) {
                // Artwork Section
                VStack(alignment: .leading, spacing: 8) {
                    Text("Artwork of the Day")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.gray)
                    
                    HStack(spacing: 12) {
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color.gray.opacity(0.3))
                            .frame(width: 100, height: 100)
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text(entry.artwork.title)
                                .font(.system(size: 14, weight: .bold))
                                .lineLimit(2)
                            
                            Text(entry.artwork.artist)
                                .font(.system(size: 12))
                                .foregroundColor(.secondary)
                            
                            Spacer()
                            
                            Text("$\(String(format: "%.2f", entry.artwork.price))")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(Color(red: 1.0, green: 0.42, blue: 0.42))
                        }
                    }
                }
                
                Divider()
                
                // Order Status Section
                if let orderStatus = entry.orderStatus {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Current Order")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.gray)
                        
                        HStack {
                            Image(systemName: statusIcon(for: orderStatus.status))
                                .foregroundColor(statusColor(for: orderStatus.status))
                            
                            VStack(alignment: .leading, spacing: 2) {
                                Text(orderStatus.status.capitalized)
                                    .font(.system(size: 14, weight: .semibold))
                                
                                if let tracking = orderStatus.trackingNumber {
                                    Text("Tracking: \(tracking)")
                                        .font(.system(size: 10))
                                        .foregroundColor(.secondary)
                                }
                            }
                            
                            Spacer()
                        }
                    }
                } else {
                    VStack(spacing: 4) {
                        Image(systemName: "cart")
                            .font(.system(size: 24))
                            .foregroundColor(.gray)
                        Text("No active orders")
                            .font(.system(size: 12))
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .padding(12)
        }
    }
    
    private func statusIcon(for status: String) -> String {
        switch status.lowercased() {
        case "confirmed": return "checkmark.circle.fill"
        case "processing": return "paintbrush.fill"
        case "shipped": return "shippingbox.fill"
        case "delivered": return "checkmark.seal.fill"
        default: return "circle.fill"
        }
    }
    
    private func statusColor(for status: String) -> Color {
        switch status.lowercased() {
        case "confirmed": return .green
        case "processing": return .orange
        case "shipped": return .blue
        case "delivered": return .green
        default: return .gray
        }
    }
}

// Main Widget
@main
struct ChartedArtWidget: Widget {
    let kind: String = "ChartedArtWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ArtworkProvider()) { entry in
            if #available(iOS 17.0, *) {
                WidgetView(entry: entry)
                    .containerBackground(.fill.tertiary, for: .widget)
            } else {
                WidgetView(entry: entry)
                    .padding()
                    .background()
            }
        }
        .configurationDisplayName("ChartedArt")
        .description("View artwork of the day and track your orders")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// Widget View Wrapper
struct WidgetView: View {
    let entry: ArtworkEntry
    @Environment(\.widgetFamily) var family
    
    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        case .systemLarge:
            LargeWidgetView(entry: entry)
        default:
            SmallWidgetView(entry: entry)
        }
    }
}

// Preview
struct ChartedArtWidget_Previews: PreviewProvider {
    static var previews: some View {
        let entry = ArtworkEntry(
            date: Date(),
            artwork: ArtworkData(
                id: "preview",
                title: "Mountain Landscape",
                artist: "John Smith",
                imageUrl: "",
                price: 89.99
            ),
            orderStatus: OrderStatus(
                orderId: "ORD-12345",
                status: "shipped",
                trackingNumber: "1Z999AA10123456784",
                estimatedDelivery: Date()
            )
        )
        
        Group {
            WidgetView(entry: entry)
                .previewContext(WidgetPreviewContext(family: .systemSmall))
            
            WidgetView(entry: entry)
                .previewContext(WidgetPreviewContext(family: .systemMedium))
            
            WidgetView(entry: entry)
                .previewContext(WidgetPreviewContext(family: .systemLarge))
        }
    }
}

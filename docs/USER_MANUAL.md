# SurfaceView – User Manual

**Version 1.0**  
**Role:** Offline Flooring Visualizer for Tradespeople

---

## Table of Contents
1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Business Setup](#3-business-setup)
4. [Managing Your Products](#4-managing-your-products)
5. [The Visualizer (Core Feature)](#5-the-visualizer)
   - [Taking the Photo](#taking-the-photo)
   - [AI Floor Detection](#ai-floor-detection)
   - [Furniture Removal (The Garage)](#furniture-removal-the-garage)
   - [Correcting the Mask](#correcting-the-mask)
   - [Applying Flooring](#applying-flooring)
6. [Managing Jobs](#6-managing-jobs)
7. [Exporting Reports](#7-exporting-reports)
8. [Troubleshooting & FAQ](#8-troubleshooting--faq)

---

## 1. Introduction

**SurfaceView** is a professional tool designed for flooring installers, sales reps, and contractors. It allows you to take a photo of a client's room and instantly visualize what different flooring products (carpet, tile, plank) will look like.

**Key Features:**
- **100% Offline:** Works without internet. All photos stay on your device.
- **AI Vision:** Automatically finds the floor and detects furniture.
- **Virtual Staging:** Can virtually "move" furniture out of the room to reveal the floor.
- **Job Packages:** Generates PDF reports for your clients.

---

## 2. Getting Started

### Installation
SurfaceView is a **Progressive Web App (PWA)**.
1. Open the app link in Chrome (Android) or Safari (iOS).
2. Tap **Share** (iOS) or **Menu** (Android).
3. Select **"Add to Home Screen"**.
4. The app now acts like a native app on your device.

### First Run
When you open the app for the first time, you will see a Welcome screen. Click **Get Started** to initialize the database on your device.

---

## 3. Business Setup

Before creating your first job, you should set up your business profile. This information appears on the PDF reports you give to clients.

1. Tap **Settings** in the bottom navigation bar.
2. Enter your **Business Name**, **Your Name**, **Phone**, **Email**, and **Address**.
3. Tap **Save Profile**.

> **Note:** This data is stored locally on your phone. SurfaceView does not upload it to any cloud server.

---

## 4. Managing Your Products

The **Catalogue** is your digital sample book. You can add the specific products you sell.

### Adding a Product
1. Go to the **Products** tab.
2. Tap the large **+ Add Product** button.
3. **Product Name:** Enter the full name (e.g., "French Oak Natural").
4. **Texture Image:** Tap the upload box to take a photo of a sample plank/tile or upload an image from your gallery.
   - *Tip:* Take photos straight-down (flat). Avoid glare or shadows for the best realism.
5. **Type:** Select Plank, Tile, or Carpet.
6. **Dimensions:** Enter the width and length in millimeters (mm). This ensures the scale is correct in the visualizer.
7. Tap **Save Product**.

---

## 5. The Visualizer

This is the heart of the app. You can access it by tapping **New Job** on the Home screen or the **+** button in the navigation bar.

### Step 1: Taking the Photo
You can **Take a Photo** directly or **Upload** one from your gallery.
* **Best Results:** Stand back to see the floor meeting the wall. Ensure the room is reasonably well-lit.

### Step 2: AI Floor Detection
Once the photo loads, SurfaceView's AI scans the image.
* It looks for the "floor" color and texture.
* It scans for furniture (sofas, tables, rugs).

### Step 3: Furniture Removal (The Garage)
If the AI detects that the room is cluttered or the floor is hard to see, a message will pop up:
**"Floor is hard to detect"**

* **Option A: Move Out Furniture (Recommended)**
  The app will identify furniture, "cut" it out, and fill the space with floor mask. This simulates an empty room.
* **Option B: Try Without Furniture**
  The app will try to lay flooring *around* the furniture.

### Step 4: Reviewing the Mask
You will see a review screen:
* **Dark Area:** Walls/Ceiling (No flooring applied).
* **Blue Highlight:** The area where new flooring will go.

If it looks wrong, tap **Fix Floor**. If it looks right, tap **Looks Good**.

### Step 5: Correcting the Mask
In "Fix Floor" mode:
* Tap **This IS Floor** (Green Plus): Tap on areas the AI missed (e.g., a shadow in the corner).
* Tap **NOT Floor** (Red Minus): Tap on areas the AI mistakenly painted (e.g., the wall or a cabinet).
* The mask updates instantly after every tap.

### Step 6: Applying Flooring
Now you are in the Visualization View.

**Tab 1: Flooring**
* Select a product from the list at the bottom.
* **Sliders:**
  * **Scale:** Adjusts the size of the planks/tiles.
  * **Rotation:** Rotates the laying direction (e.g., 45 degrees).
  * **Opacity:** Blends the new floor with the original photo shadows for realism.

**Tab 2: Garage (Furniture)**
* If you used "Move Out Furniture", the items are stored here.
* Toggle the **Eye Icon** to show/hide the furniture on top of your new floor.

When satisfied, tap **Save** at the top right.

---

## 6. Managing Jobs

The **Jobs** tab lists all your saved projects.
* **Status:** Jobs are marked as 'Draft' until you export them.
* **Edit:** You can reopen a job to try different products on the same room photo without re-detecting the floor.

---

## 7. Exporting Reports

To give a quote or proposal to a client:
1. Open a Job from the list.
2. Tap **Export PDF**.
3. A standardized document is generated containing:
   - Your Business Header.
   - Job Details (Date, Client).
   - The Visualized Photo.
   - Product Specifications (Name, Dimensions).
   - The Original "Before" Photo.

This uses your device's native printing system. You can "Save to Files" or send directly to a printer.

---

## 8. Troubleshooting & FAQ

**Q: Why is the floor mask painting the wall blue?**  
A: The wall color might be very similar to the floor. Use the **Fix Floor** tool and tap "NOT Floor" on the wall to teach the AI the difference.

**Q: Why is the app slow?**  
A: If you upload a very high-resolution photo (e.g., 4K or 12MP), the AI takes longer to process pixels. The app automatically resizes images internally to optimize performance, but older phones may take a few seconds.

**Q: Can I use this on my desktop computer?**  
A: Yes! SurfaceView works in Chrome on Windows and Mac. However, it is optimized for touch interaction on tablets and phones.

**Q: Where are my photos stored?**  
A: All photos are stored inside the browser's **IndexedDB** on your device. If you clear your browser history/data, you may lose your saved jobs.

**Q: Does it handle stairs?**  
A: Currently, the AI is optimized for flat surfaces. Stairs may require manual painting (coming in a future update).

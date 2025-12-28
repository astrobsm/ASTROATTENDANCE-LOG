using System;
using System.Text;
using System.Text.Json;
using DPUruNet;

namespace FingerprintHelper
{
    /// <summary>
    /// Command-line helper application for DigitalPersona U.are.U SDK integration
    /// This app is called from Node.js to perform fingerprint operations
    /// 
    /// Usage:
    ///   FingerprintHelper.exe status              - Check device status
    ///   FingerprintHelper.exe enroll <staffId>    - Enroll a fingerprint
    ///   FingerprintHelper.exe verify              - Verify against stored templates
    ///   FingerprintHelper.exe identify            - Identify from all templates
    /// </summary>
    class Program
    {
        private static Reader? _reader;
        private static readonly string TemplatesPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "AstroBSM", "fingerprint-templates"
        );

        static int Main(string[] args)
        {
            try
            {
                // Ensure templates directory exists
                Directory.CreateDirectory(TemplatesPath);

                if (args.Length == 0)
                {
                    OutputError("No command specified");
                    return 1;
                }

                string command = args[0].ToLower();

                return command switch
                {
                    "status" => CheckDeviceStatus(),
                    "enroll" when args.Length >= 2 => EnrollFingerprint(args[1]),
                    "verify" when args.Length >= 2 => VerifyFingerprint(args[1]),
                    "identify" => IdentifyFingerprint(),
                    "delete" when args.Length >= 2 => DeleteTemplate(args[1]),
                    "list" => ListTemplates(),
                    _ => HandleUnknownCommand(command)
                };
            }
            catch (Exception ex)
            {
                OutputError($"Fatal error: {ex.Message}");
                return 1;
            }
            finally
            {
                CloseReader();
            }
        }

        private static int HandleUnknownCommand(string command)
        {
            OutputError($"Unknown command: {command}");
            return 1;
        }

        /// <summary>
        /// Initialize the fingerprint reader
        /// </summary>
        private static bool InitializeReader()
        {
            try
            {
                // Get list of connected readers
                ReaderCollection readers = ReaderCollection.GetReaders();
                
                if (readers.Count == 0)
                {
                    OutputError("No fingerprint readers found");
                    return false;
                }

                // Use the first available reader (U.are.U 4500)
                _reader = readers[0];
                
                // Open the reader
                Constants.ResultCode result = _reader.Open(Constants.CapturePriority.DP_PRIORITY_COOPERATIVE);
                
                if (result != Constants.ResultCode.DP_SUCCESS)
                {
                    OutputError($"Failed to open reader: {result}");
                    return false;
                }

                return true;
            }
            catch (Exception ex)
            {
                OutputError($"Failed to initialize reader: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Close the reader connection
        /// </summary>
        private static void CloseReader()
        {
            try
            {
                _reader?.Dispose();
            }
            catch { }
        }

        /// <summary>
        /// Check device connection status
        /// </summary>
        private static int CheckDeviceStatus()
        {
            try
            {
                ReaderCollection readers = ReaderCollection.GetReaders();
                
                if (readers.Count == 0)
                {
                    OutputResult(new
                    {
                        success = true,
                        connected = false,
                        deviceReady = false,
                        deviceName = "None",
                        message = "No fingerprint readers connected"
                    });
                    return 0;
                }

                var readerInfo = readers[0];
                
                OutputResult(new
                {
                    success = true,
                    connected = true,
                    deviceReady = true,
                    deviceName = readerInfo.Description.Name ?? "DigitalPersona U.are.U",
                    serialNumber = readerInfo.Description.SerialNumber ?? "Unknown",
                    message = "Device is ready for fingerprint capture"
                });
                
                return 0;
            }
            catch (Exception ex)
            {
                OutputResult(new
                {
                    success = false,
                    connected = false,
                    deviceReady = false,
                    deviceName = "Unknown",
                    message = $"Error checking device: {ex.Message}"
                });
                return 1;
            }
        }

        /// <summary>
        /// Enroll a new fingerprint for a staff member
        /// Captures 4 samples and creates an enrollment template
        /// </summary>
        private static int EnrollFingerprint(string staffId)
        {
            try
            {
                if (!InitializeReader())
                    return 1;

                // Check if staff already enrolled
                string templateFile = Path.Combine(TemplatesPath, $"{staffId}.fpt");
                if (File.Exists(templateFile))
                {
                    OutputError("Staff member already has a registered fingerprint");
                    return 1;
                }

                // Capture 4 fingerprint samples for enrollment
                const int requiredSamples = 4;
                const int maxRetries = 3; // Max retries per sample
                var fmds = new List<Fmd>();

                for (int i = 0; i < requiredSamples; i++)
                {
                    int retryCount = 0;
                    bool sampleCaptured = false;

                    while (!sampleCaptured && retryCount < maxRetries)
                    {
                        // Output progress message to stderr (so it doesn't interfere with JSON output)
                        Console.Error.WriteLine($"Capture {i + 1} of {requiredSamples} - Place finger on scanner...");

                        // Capture fingerprint with 10 second timeout
                        CaptureResult captureResult = _reader!.Capture(
                            Constants.Formats.Fid.ANSI,
                            Constants.CaptureProcessing.DP_IMG_PROC_DEFAULT,
                            10000, // 10 second timeout
                            _reader.Capabilities.Resolutions[0]
                        );

                        if (captureResult.ResultCode == Constants.ResultCode.DP_SUCCESS)
                        {
                            if (captureResult.Quality == Constants.CaptureQuality.DP_QUALITY_GOOD)
                            {
                                // Create FMD from captured image
                                DataResult<Fmd> fmdResult = FeatureExtraction.CreateFmdFromFid(
                                    captureResult.Data,
                                    Constants.Formats.Fmd.ANSI
                                );

                                if (fmdResult.ResultCode == Constants.ResultCode.DP_SUCCESS)
                                {
                                    fmds.Add(fmdResult.Data);
                                    Console.Error.WriteLine($"Sample {i + 1} captured successfully");
                                    sampleCaptured = true;
                                }
                                else
                                {
                                    Console.Error.WriteLine($"Failed to process fingerprint, retrying...");
                                    retryCount++;
                                }
                            }
                            else
                            {
                                Console.Error.WriteLine($"Poor quality capture ({captureResult.Quality}), please try again...");
                                retryCount++;
                            }
                        }
                        else if (captureResult.Quality == Constants.CaptureQuality.DP_QUALITY_TIMED_OUT)
                        {
                            Console.Error.WriteLine($"Timeout - no finger detected, retrying...");
                            retryCount++;
                        }
                        else
                        {
                            Console.Error.WriteLine($"Capture issue: {captureResult.ResultCode}, retrying...");
                            retryCount++;
                        }
                    }

                    if (!sampleCaptured)
                    {
                        OutputError($"Failed to capture sample {i + 1} after {maxRetries} attempts. Please try enrollment again.");
                        return 1;
                    }
                }

                // Create enrollment FMD from captured samples
                DataResult<Fmd> enrollmentResult = DPUruNet.Enrollment.CreateEnrollmentFmd(
                    Constants.Formats.Fmd.ANSI,
                    fmds.ToArray()
                );

                if (enrollmentResult.ResultCode != Constants.ResultCode.DP_SUCCESS)
                {
                    OutputError($"Failed to create enrollment template: {enrollmentResult.ResultCode}");
                    return 1;
                }

                // Generate template ID
                string templateId = $"FP-{Guid.NewGuid():N}";

                // Save template to file
                var templateData = new
                {
                    templateId,
                    staffId,
                    fmdData = Convert.ToBase64String(enrollmentResult.Data.Bytes),
                    createdAt = DateTime.UtcNow.ToString("O")
                };

                string json = JsonSerializer.Serialize(templateData);
                File.WriteAllText(templateFile, json);

                OutputResult(new
                {
                    success = true,
                    templateId,
                    staffId,
                    message = "Fingerprint enrolled successfully"
                });

                return 0;
            }
            catch (Exception ex)
            {
                OutputError($"Enrollment failed: {ex.Message}");
                return 1;
            }
        }

        /// <summary>
        /// Verify a fingerprint against a specific staff member's template
        /// </summary>
        private static int VerifyFingerprint(string staffId)
        {
            try
            {
                if (!InitializeReader())
                    return 1;

                // Load template for staff member
                string templateFile = Path.Combine(TemplatesPath, $"{staffId}.fpt");
                if (!File.Exists(templateFile))
                {
                    OutputResult(new
                    {
                        success = true,
                        matched = false,
                        staffId = (string?)null,
                        message = "Staff member does not have a registered fingerprint"
                    });
                    return 0;
                }

                var templateData = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(
                    File.ReadAllText(templateFile)
                );
                
                byte[] fmdBytes = Convert.FromBase64String(templateData!["fmdData"].GetString()!);
                // Fmd constructor: (byte[] bytes, int format, string version)
                // ANSI format = 1769473, version from wrapper
                Fmd enrolledFmd = new Fmd(fmdBytes, (int)Constants.Formats.Fmd.ANSI, Constants.WRAPPER_VERSION);

                Console.Error.WriteLine("Place finger on scanner for verification...");

                // Capture fingerprint for verification
                CaptureResult captureResult = _reader!.Capture(
                    Constants.Formats.Fid.ANSI,
                    Constants.CaptureProcessing.DP_IMG_PROC_DEFAULT,
                    10000, // 10 second timeout
                    _reader.Capabilities.Resolutions[0]
                );

                if (captureResult.ResultCode != Constants.ResultCode.DP_SUCCESS)
                {
                    OutputError($"Capture failed: {captureResult.ResultCode}");
                    return 1;
                }

                // Create FMD from captured image
                DataResult<Fmd> fmdResult = FeatureExtraction.CreateFmdFromFid(
                    captureResult.Data,
                    Constants.Formats.Fmd.ANSI
                );

                if (fmdResult.ResultCode != Constants.ResultCode.DP_SUCCESS)
                {
                    OutputError($"Failed to create FMD: {fmdResult.ResultCode}");
                    return 1;
                }

                // Compare fingerprints
                CompareResult compareResult = Comparison.Compare(
                    enrolledFmd,
                    0,
                    fmdResult.Data,
                    0
                );

                // Check if match (dissimilarity score below threshold)
                // Lower score = better match. 
                // FAR thresholds: 21474 = 0.001%, 2147 = 0.01%, 214 = 0.1%, 21 = 1%
                const int FAR_THRESHOLD = 21474; // 0.001% False Accept Rate
                bool matched = compareResult.Score < FAR_THRESHOLD;

                OutputResult(new
                {
                    success = true,
                    matched,
                    staffId = matched ? staffId : null,
                    score = compareResult.Score,
                    message = matched ? "Fingerprint verified successfully" : "Fingerprint does not match"
                });

                return 0;
            }
            catch (Exception ex)
            {
                OutputError($"Verification failed: {ex.Message}");
                return 1;
            }
        }

        /// <summary>
        /// Identify a fingerprint against all stored templates
        /// </summary>
        private static int IdentifyFingerprint()
        {
            try
            {
                if (!InitializeReader())
                    return 1;

                // Load all templates
                var templates = new List<(string staffId, Fmd fmd)>();
                foreach (string file in Directory.GetFiles(TemplatesPath, "*.fpt"))
                {
                    try
                    {
                        var templateData = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(
                            File.ReadAllText(file)
                        );
                        
                        string staffId = templateData!["staffId"].GetString()!;
                        byte[] fmdBytes = Convert.FromBase64String(templateData["fmdData"].GetString()!);
                        // Fmd constructor: (byte[] bytes, int format, string version)
                        Fmd fmd = new Fmd(fmdBytes, (int)Constants.Formats.Fmd.ANSI, Constants.WRAPPER_VERSION);
                        
                        templates.Add((staffId, fmd));
                    }
                    catch { /* Skip invalid templates */ }
                }

                if (templates.Count == 0)
                {
                    OutputResult(new
                    {
                        success = true,
                        matched = false,
                        staffId = (string?)null,
                        message = "No fingerprints enrolled in the system"
                    });
                    return 0;
                }

                Console.Error.WriteLine("Place finger on scanner for identification...");

                // Capture fingerprint
                CaptureResult captureResult = _reader!.Capture(
                    Constants.Formats.Fid.ANSI,
                    Constants.CaptureProcessing.DP_IMG_PROC_DEFAULT,
                    10000,
                    _reader.Capabilities.Resolutions[0]
                );

                if (captureResult.ResultCode != Constants.ResultCode.DP_SUCCESS)
                {
                    OutputError($"Capture failed: {captureResult.ResultCode}");
                    return 1;
                }

                // Create FMD from captured image
                DataResult<Fmd> fmdResult = FeatureExtraction.CreateFmdFromFid(
                    captureResult.Data,
                    Constants.Formats.Fmd.ANSI
                );

                if (fmdResult.ResultCode != Constants.ResultCode.DP_SUCCESS)
                {
                    OutputError($"Failed to create FMD: {fmdResult.ResultCode}");
                    return 1;
                }

                // Compare against all templates
                string? matchedStaffId = null;
                int bestScore = int.MaxValue;

                foreach (var (staffId, enrolledFmd) in templates)
                {
                    CompareResult compareResult = Comparison.Compare(
                        enrolledFmd,
                        0,
                        fmdResult.Data,
                        0
                    );

                    if (compareResult.Score < bestScore)
                    {
                        bestScore = compareResult.Score;
                        // FAR threshold: 21474 = 0.001% False Accept Rate
                        const int FAR_THRESHOLD = 21474;
                        if (compareResult.Score < FAR_THRESHOLD)
                        {
                            matchedStaffId = staffId;
                        }
                    }
                }

                OutputResult(new
                {
                    success = true,
                    matched = matchedStaffId != null,
                    staffId = matchedStaffId,
                    score = bestScore,
                    message = matchedStaffId != null 
                        ? "Fingerprint identified successfully" 
                        : "No matching fingerprint found"
                });

                return 0;
            }
            catch (Exception ex)
            {
                OutputError($"Identification failed: {ex.Message}");
                return 1;
            }
        }

        /// <summary>
        /// Delete a staff member's fingerprint template
        /// </summary>
        private static int DeleteTemplate(string staffId)
        {
            try
            {
                string templateFile = Path.Combine(TemplatesPath, $"{staffId}.fpt");
                
                if (File.Exists(templateFile))
                {
                    File.Delete(templateFile);
                    OutputResult(new
                    {
                        success = true,
                        message = "Fingerprint template deleted successfully"
                    });
                }
                else
                {
                    OutputResult(new
                    {
                        success = true,
                        message = "No fingerprint template found for this staff member"
                    });
                }

                return 0;
            }
            catch (Exception ex)
            {
                OutputError($"Failed to delete template: {ex.Message}");
                return 1;
            }
        }

        /// <summary>
        /// List all enrolled templates
        /// </summary>
        private static int ListTemplates()
        {
            try
            {
                var templates = new List<object>();
                
                foreach (string file in Directory.GetFiles(TemplatesPath, "*.fpt"))
                {
                    try
                    {
                        var templateData = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(
                            File.ReadAllText(file)
                        );
                        
                        templates.Add(new
                        {
                            staffId = templateData!["staffId"].GetString(),
                            templateId = templateData["templateId"].GetString(),
                            createdAt = templateData["createdAt"].GetString()
                        });
                    }
                    catch { }
                }

                OutputResult(new
                {
                    success = true,
                    count = templates.Count,
                    templates
                });

                return 0;
            }
            catch (Exception ex)
            {
                OutputError($"Failed to list templates: {ex.Message}");
                return 1;
            }
        }

        /// <summary>
        /// Output success result as JSON
        /// </summary>
        private static void OutputResult(object result)
        {
            Console.WriteLine(JsonSerializer.Serialize(result));
        }

        /// <summary>
        /// Output error as JSON
        /// </summary>
        private static void OutputError(string message)
        {
            Console.WriteLine(JsonSerializer.Serialize(new
            {
                success = false,
                error = message
            }));
        }
    }
}

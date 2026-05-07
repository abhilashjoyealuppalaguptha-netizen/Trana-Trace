module uart_tx (
    input  wire       clk,
    input  wire       rst,
    input  wire       tx_start,
    input  wire [7:0] tx_data,
    output reg        tx_pin,
    output reg        tx_busy
);

parameter BAUD_DIV = 12'd2812; // 27MHz / 9600

reg [11:0] baud_cnt;
reg [9:0]  shift_reg;
reg [3:0]  bit_cnt;

always @(posedge clk or posedge rst) begin
    if (rst) begin
        tx_pin    <= 1'b1;
        tx_busy   <= 1'b0;
        baud_cnt  <= 12'd0;
        bit_cnt   <= 4'd0;
        shift_reg <= 10'd0;
    end else begin
        if (!tx_busy && tx_start) begin
            shift_reg <= {1'b1, tx_data, 1'b0};
            tx_busy   <= 1'b1;
            baud_cnt  <= 12'd0;
            bit_cnt   <= 4'd0;
        end else if (tx_busy) begin
            if (baud_cnt < BAUD_DIV - 12'd1) begin
                baud_cnt <= baud_cnt + 12'd1;
            end else begin
                baud_cnt  <= 12'd0;
                tx_pin    <= shift_reg[0];
                shift_reg <= {1'b1, shift_reg[9:1]};
                bit_cnt   <= bit_cnt + 4'd1;
                if (bit_cnt == 4'd9) begin
                    tx_busy <= 1'b0;
                    tx_pin  <= 1'b1;
                end
            end
        end
    end
end

endmodule